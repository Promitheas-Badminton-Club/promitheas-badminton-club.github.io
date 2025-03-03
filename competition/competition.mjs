import { parse } from "csv-parse/sync";
import Debug from "debug";

const debug = Debug("yearly-ladder");

function parseScore(scoreString) {
  // Regex to match all game scores
  const regex = /(\d{1,2})[^\d\s](\d{1,2})/g;

  const matches = [];
  let match;
  // Use a loop to collect all matches
  while ((match = regex.exec(scoreString)) !== null) {
    matches.push([parseInt(match[1], 10), parseInt(match[2], 10)]);
  }

  if (matches.length === 0) {
    throw new Error("Invalid score format");
  }

  return matches;
}

const googleSheetPublicCSVUrl = (url) => {
  const { groups: { gid, sheetId } } =
    /\/d\/(?<sheetId>(\w|-)+)\/.+gid=(?<gid>\d+)/
      .exec(url);

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
};

async function fetchGoogleSheetData(url) {
  const res = await fetch(googleSheetPublicCSVUrl(url));

  if (!res.ok) {
    throw new Error(`Failed to fetch: ${url}`);
  }

  const csvText = await res.text();
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    on_record(record, { lines }) {
      record.Row = lines; 

      return record;
    },  
  });

  return records;
}

export default async function data (url) {
  const csvData = (await fetchGoogleSheetData(url)).map((game) => {
    game.Results = parseScore(game.Results);

    return game;
  });

  debug(csvData);

  // Reduce function to process the ladder

  const ladderSystem = csvData.reduce((ladder, record) => {
    const { Challenger: challenger, Challenged: challenged, Results: result } =
      record;

    // Ensure both players are on the ladder
    if (!ladder.includes(challenger)) ladder.push(challenger);
    if (!ladder.includes(challenged)) ladder.push(challenged);

    const challengerIndex = ladder.indexOf(challenger);
    const challengedIndex = ladder.indexOf(challenged);

    // Parse game results and determine the match winner
    const scores = result;
    let challengerWins = 0;
    let challengedWins = 0;

    scores.forEach(([challengerScore, challengedScore]) => {
      if (challengerScore > challengedScore) challengerWins++;
      else challengedWins++;
    });

    debug("challengerWins", challengerWins);
    debug("challengedWins", challengedWins);

    if (challengerWins > challengedWins) {
      // Only swap of challenger has lower rank than challenged.
      if (challengedIndex < challengerIndex) {
        // Remove the challenger from its old spot
        ladder.splice(challengerIndex, 1);

        // Place challenger on challenged spot
        ladder.splice(challengedIndex, 0, challenger);
      }
    }

    return ladder;
  }, []);

  let currentLevel = 1; // Start at level 1
  const ladderData = {
    ladder: ladderSystem.map((name, index) => {
      const addHr = (index & (index + 1)) === 0; // Check if index is one less than a power of two
      const level = currentLevel;

      if (addHr) {
        currentLevel++; // Increment the level after an <hr>
      }

      return {
        rank: index + 1,
        name,
        level,
        addHr,
        isFirst: index === 0,
        isSecond: index === 1,
        isThird: index === 2,
        isOther: index >= 3,
      };
    }),
  };

  debug(ladderSystem);

  ladderData.games = csvData;
  ladderData.spreadsheet_url = url;

  return ladderData;
}

const notProd = () => {};

notProd(["tape"], async (tap) => {
  // Tests
  tap.test("parseScores parses single game", (t) => {
    const input = "21-19";
    const expected = [[21, 19]];
    t.same(
      parseScore(input),
      expected,
      "Should correctly parse single game",
    );
    t.end();
  });

  tap.test("parseScore parses two games", (t) => {
    const input = "21a10 21-9";
    const expected = [[21, 10], [21, 9]];
    t.same(
      parseScore(input),
      expected,
      "Should correctly parse two games",
    );
    t.end();
  });

  tap.test("parseScore parses three games", (t) => {
    const input = "21:15 | 21-17 | 15/21";
    const expected = [[21, 15], [21, 17], [15, 21]];
    t.same(
      parseScore(input),
      expected,
      "Should correctly parse three games",
    );
    t.end();
  });

  tap.test("parseScore throws on invalid input", (t) => {
    const input = "invalid input";
    t.throws(
      () => parseScore(input),
      new Error("Invalid score format"),
      "Should throw error on invalid input",
    );
    t.end();
  });
});
