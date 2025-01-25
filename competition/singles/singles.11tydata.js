import Mustache from "mustache";
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
  });

  return records;
}

const url =
  "https://docs.google.com/spreadsheets/d/1CI0aGjYIyPN0ExFJhUMFB3WaE2yV3UvnS6HKVt0Ti00/edit?resourcekey=&gid=131035744#gid=131035744";
const csvData = (await fetchGoogleSheetData(url)).map(game => {
  game.Results = parseScore(game.Results)

  return game
})

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

  if (challengerWins >= 2) {
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

const template = `
        <h2 id="Ranking">Ranking</h2>
        <ol>
          {{#ladder}}
          {{#addHr}}
            <h3>Level {{level}}</h3>
          {{/addHr}}
          <li>
            {{name}}
            {{#isFirst}}<span class="medal">🥇</span>{{/isFirst}}
            {{#isSecond}}<span class="medal">🥈</span>{{/isSecond}}
            {{#isThird}}<span class="medal">🥉</span>{{/isThird}}
          </li>
          {{/ladder}}

          {{^ladder}}
            <p>No ladder entries available.</p>
          {{/ladder}}
        </ol>

        <h2 id="Rules">Rules</h2>

    <ol>
      <li>
        <strong>Player Entry</strong>
        <ul>
          <li>Players are <strong>automatically added</strong> to the ladder when they play their first game.</li>
          <li>New players enter the ladder at the position of the <strong>player they defeated</strong> in their first match. If the challenger wins, they take the defeated player's rank, and the defeated player moves down one rank.</li>
          <li>If the challenger loses, the ladder remains unchanged, and they enter the bottom of the ladder.</li>
        </ul>
      </li>
      <li>
        <strong>Challenges</strong>
        <ul>
          <li>Players can challenge any other player on the ladder.</li>
          <li>If the challenger wins, they move up to the position of the challenged player, and the challenged player moves down one rank.</li>
          <li>If the challenger loses, the ladder remains unchanged.</li>
        </ul>
      </li>
      <li>
        <strong>Match Format</strong>
        <ul>
          <li>Matches are played in a <strong>best-of-three</strong> format (first to 2 game wins).</li>
          <li>The score is tracked in a <code>x-y</code> format (e.g., "21-19 19-21 21-18").</li>
        </ul>
      </li>
      <li>
        <strong>Ladder Reset</strong>
        <ul>
          <li>The ladder is <strong>reset every year</strong>.</li>
        </ul>
      </li>
    </ol>

    <h2 id="Play">Play</h2>
    <ol>
      <li>
        <a href="https://chat.whatsapp.com/CIl4T9qvd4Q1BiYNMVQXp8" target="_blank">
          Join the WhatsApp chat group
        </a> and start challenging players.
      </li>

      <li>
        Submit a match result using 
        <a href="https://forms.gle/6x2Eygpfm2owNoZf6" target="_blank">
          the results form.
        </a>
      </li>

      <li>
        View all your matches and their results on
        <a href="https://docs.google.com/spreadsheets/d/1CI0aGjYIyPN0ExFJhUMFB3WaE2yV3UvnS6HKVt0Ti00/edit?resourcekey=&gid=131035744#gid=131035744">
          Google sheets
        </a>
      </li>

    </ol>
`;

ladderData.games = csvData;

export default ladderData

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
