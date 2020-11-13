import {setOptions, getOptions} from '../src/options'

global.chrome = {
    storage: {
        sync: {
            // meh.
            get: (name, res) => {
                res({'options': {
                    host: 'http://badhost:43210', // some random port, to cause it fail
                }})
            }
        },
    },
    runtime: {
        lastError: null,
        getPlatformInfo: (res) => { res({}) },
    }
}


test('options', async () => {
    // shouldn't crash at least..
    const opts = await getOptions()
})
// TODO could check options migrations?

import fetch from 'node-fetch'
global.fetch = fetch


import {backend} from '../src/api'
test('visits', async() => {
    // const opts = await getOptions()
    // opts.host = host: 'http//bad.host',
   
    // TODO have a defensive and offensive modes?
    // but defensive for network errors makes def makes sense anyway
    const vis = await backend.visits('http://123.com')
    // FIXME test specific error?
    expect(vis).toBeInstanceOf(Error)
})


import {allsources} from '../src/sources'


// meh.
global.chrome.history = {
    getVisits: (obj, res) => res([]),
    search   : (obj, res) => res([]),
}
global.chrome.bookmarks = {
    getTree: (res) => res([{
        children: [{
            url: 'http://whatever.com/',
            dateAdded: 16 * 10 ** 8 * 1000,
        }],
    }]),
}

test('visits_allsources', async() => {
    const vis = await allsources.visits('https://whatever.com/')
    expect(vis.visits).toHaveLength(2)
    expect(vis.normalised_url).toStrictEqual('whatever.com')
})


test('search_works', async () => {
    // at least shouldn't crash
    const res = await allsources.search('https://123.coom')
    const [e] = res.visits
    expect(e.message).toMatch(/request .* failed/)
})

import {MultiSource, bookmarks, thisbrowser} from '../src/sources'

test('search_defensive', async() => {
    // precondition: some error in processing history api, e.g. it's unavailable or something
    global.chrome.history.search    = (q, res) => res(null)
    global.chrome.bookmarks.getTree = (res)    => res(null)

    // TODO wtf?? for some reason deafult order (backend, browser, bookmarks) causes
    // 'Promise rejection was handled asynchronously'
    // I wonder if it's some issue with node fetch implementation... or just node version??
    // for some reason different order works :shrug:

    const res = await new MultiSource(thisbrowser, bookmarks, backend)
          .search('http://whatever.com')

    console.error(res.visits)
    const [e1, e2, e3] = res.visits
    // eh. fragile, but at least makes sure we test exactly the thing we want
    expect(e1.message).toMatch(/results is not iterable/)
    expect(e2.message).toMatch(/Cannot read property/)
    expect(e3.message).toMatch(/request .* failed/)
})


import fetchMock from 'jest-fetch-mock'
// TODO use it as a fixture..
// beforeEach(() => {
//   fetch.resetMocks()
// })

test('visits_badresponse', async() => {
    fetchMock.enableMocks()
    fetchMock.mockResponse({body: 'bad!'})
    const res = await backend.visits('http://mock.com')
    expect(res).toBeInstanceOf(Error)
})
