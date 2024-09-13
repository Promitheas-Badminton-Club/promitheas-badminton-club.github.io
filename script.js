
// Make sure this script is run after all the html.
(function () {
  for (const elem of document.querySelectorAll('[ps-route-selected]')) {
    let matched = false
    for (const valueEl of elem.querySelectorAll('[ps-route-selected-value]')) {
      const value = valueEl
        .attributes
        .getNamedItem('ps-route-selected-value')
        .value

      if (window.location.pathname.startsWith(value)) {
        matched = true
        valueEl.classList.add('selected')
      }
    }

    // For when none match we have a fallback option.
    elem.querySelector('[ps-route-selected-fallback]')?.classList.add('selected')
  }
})();

// Anchors with full urls open a new window
// Change hash urls to lowercase
(function () {

  for (const anchor of document.getElementsByTagName('a')) {
    const href = anchor.getAttribute('href').trim()

    href?.startsWith('#') &&
      anchor.setAttribute('href', href.toLowerCase())

    href?.startsWith('http') &&
      anchor.setAttribute('target', '_blank')
  }

})();

// (function() {
//   const sequence = 'edit'
//   let current = ''
//
//   const cb = e => {
//     current = current + e.key
//
//     if (!sequence.startsWith(current)) {
//       current = ''
//
//       document.removeEventLister('keydown', e)
//       return
//     }
//
//     if (sequence === current) {
//       console.log('yey we did it')
//     }
//
//   }
//
//   document.addEventListener('keydown', e)
// })()

// Make certain headers also anchors to themselves.
(function () {
  for (const item of document.getElementsByTagName('h2')) {
    const id = item.innerText.toLowerCase()

    item.setAttribute('id', id)

    if (!id) return

    const anchor = document.createElement('a')

    anchor.setAttribute('href', `#${id}`)
    anchor.innerText = id

    item.innerText = ''
    item.appendChild(anchor)
  }
})();
