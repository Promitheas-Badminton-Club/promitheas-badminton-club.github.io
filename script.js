
// Make sure this script is run after all the html.
(function () {
  for (const elem of document.querySelectorAll('[ps-route-selected]')) {
    for (const valueEl of elem.querySelectorAll('[ps-route-selected-value]')) {
      const value = valueEl
        .attributes
        .getNamedItem('ps-route-selected-value')
        .value

      window.location.pathname.startsWith(value) &&
        valueEl.classList.add('selected')
    }
  }
})();

// Make certain headers also anchors to themselves.
(function () {
  for (const item of document.getElementsByTagName('h2')) {
    const id = item.innerText

    item.setAttribute('id', id)

    if (!id) return

    const anchor = document.createElement('a')

    anchor.setAttribute('href', `#${id}`)
    anchor.innerText = id

    item.innerText = ''
    item.appendChild(anchor)
  }
})()
