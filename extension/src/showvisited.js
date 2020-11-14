/* NOTE: this file is kept intact by webpack, for the sake of highlighting and linting  */

// 'API': take
// - link_element: list of <a> DOM elements on the page
// - visited: Map<Url, ?Visit>
// then you can walk through this and decorate as you please

function createLink(href, title) {
    const a = document.createElement('a')
    a.title = title
    a.href  = href
    a.appendChild(document.createTextNode(title))
    return a
}

function appendText(e, text) {
    e.appendChild(document.createTextNode(text))
}

function formatVisit(v) {
    const e = document.createElement('code')
    e.style.whiteSpace = 'pre-wrap'
    e.style.display = 'block'
    e.style.maxWidth = '120ch'
    const {
        original_url: original,
        dt_local    : dt,
        tags        : tags,
        context     : context,
        locator     : locator,
    } = v
    appendText(e, 'original: ')
    e.appendChild(createLink(original, original))
    appendText(e, `\ndt      : ${new Date(dt).toLocaleString()}`) // meh
    appendText(e, `\ntags    : ${tags.join(' ')}`)
    if (context != null) {
        appendText(e, '\n' + context)
    }
    const els = [e]
    const {href: href, title: title} = locator || {}
    if (href != null) {
        els.push(createLink(href, title))
    }
    return els
}

// TODO I guess, these snippets could be writable by people? and then they can customize tooltips to their liking
// returns extra elements to insert in DOM
function decorateLink(element) {
    const url = element.href
    // 'visited' passed in backgroud.js
    // eslint-disable-next-line no-undef
    const v = visited.get(url)
    if (!v) {
        return // no visits
    }

    element.classList.add('promnesia-visited')

    let eyecolor = '#550000' // 'boring'

    const eye = document.createElement('span')
    eye.classList.add('nonselectable')
    eye.textContent = '👁'
    eye.style.color = eyecolor
    eye.style.position = 'absolute'
    {
        let rect = element.getBoundingClientRect()
        eye.style.top  = `calc(${(window.scrollY + rect.top  )}px - 0.8em)`
        eye.style.left =      `${(window.scrollX + rect.right)}px`
    }

    if (v === true) {
        // nothing else interesting we can do with such visit
        return [eye]
    }

    eyecolor = v.context == null ? '#6666ff' : '#00ff00' // copy-pasted from 'generate' script..
    eye.style.color = eyecolor

    let toggler = document.createElement('span')
    toggler.title = 'click to pin'
    element.replaceWith(toggler)
    toggler.style.cursor = 'pointer'
    toggler.style.paddingTop    = '0.5em'
    toggler.style.paddingBottom = '0.5em'
    toggler.appendChild(element)

    let popup = document.createElement('div')
    let content = document.createElement('div')
    content.style.border = 'solid 1px'
    content.style.background = 'lightyellow'
    content.style.padding = '1px'
    popup.appendChild(content)
    // TODO max width??
    // TODO use an actual style or something?
    let ev = formatVisit(v)
    for (const e of ev) {
        content.appendChild(e)
    }

    // TODO would be cool to reuse the same style used by the sidebar...
    let rect = toggler.getBoundingClientRect()
    content.style.top  = `${(window.scrollY + rect.bottom)}px`
    content.style.left = `${(window.scrollX + rect.left  )}px`
    content.style.position = 'absolute'
    // hmm, :hover pseudo class didn't work on that span for some reason...
    // https://stackoverflow.com/questions/12361244/css-hover-pseudo-class-not-working#comment17060438_12361291
    // logic as follows: when over toggler, show the popup
    const over = () => {
        content.style.display = 'block'
        toggler.style.background = 'lightyellow'
        eye    .style.color      = 'lightyellow'
        toggler.style.outline = '1px solid'

        toggler.removeEventListener('mouseover', over)
        toggler.addEventListener   ('mouseout' , out )
    }
    // when out toggler, hide it
    const out = () => {
        content.style.display = 'none'
        toggler.style.background = eyecolor + '77' // transparency
        eye    .style.color      = eyecolor
        toggler.style.outline = ''

        toggler.removeEventListener('mouseout' , out )
        toggler.addEventListener   ('mouseover', over)
    }
    // and click to pin/unpin!
    const click = () => {
        const pinned = content.pinned || false
        if (pinned) {
            over() // let default behaviour take over
        } else {
            toggler.removeEventListener('mouseout' , out)
            toggler.removeEventListener('mouseover', over)
        }
        content.pinned = !pinned
    }
    toggler.addEventListener('click', click)
    out()
    element.appendChild(popup)
    return [eye, popup]
}

function decorateLinks() {
    let cont = document.createElement('div') // todo class?
    document.body.appendChild(cont)

    // TODO make this async via setTimeout, just in case it's slow?

    // 'link_elements' passed in background.js
    // eslint-disable-next-line no-undef
    for (const link_element of link_elements) {
        let elems = null
        try { // best to be defensive here..
            elems = decorateLink(link_element)
        } catch (e) {
            console.error(e)
        }

        if (elems != null) {
            for (const e of elems) {
                cont.appendChild(e)
            }
        }

    }
}

decorateLinks()
