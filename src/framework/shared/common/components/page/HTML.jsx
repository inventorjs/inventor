/**
 * 通用页面框架
 *
 * @author : sunkeysun
 */

import React from 'react'

export default function(props={}) {
    const {
        title='',
        keywords='',
        description='',
        initialState={},
        nodeEnv='',
        appName='',
        appContent='',
        sharedPath='',
        ssr=false,
        noHash=false,
        webHost='',
    } = props

    const { jsList: vendorJsList=[], cssList: vendorCssList=[] } = require(`${sharedPath}/vendor/addon`)
    const { jsList: commonJsList=[], cssList: commonCssList=[] } = require(`${sharedPath}/common/addon`)
    const { jsList=[], cssList=[] } = require(`${sharedPath}/apps/${appName}/addon`)

    let realJsList = vendorJsList.concat(commonJsList).concat(jsList)
    let realCssList = vendorCssList.concat(commonCssList).concat(cssList)

    if (noHash) {
        realJsList = _.map(realJsList, (js) => js.replace(/(.*)\.\w{10,}\.js$/, '$1.js'))
        realCssList = _.map(realCssList, (css) => css.replace(/(.*)\.\w{10,}\.css$/, '$1.css'))
    }

    const jsonInitialState = JSON.stringify(initialState)

    return (
        <html>
            <head>
                <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
                <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
                <meta httpEquiv="keywords" content={ keywords } />
                <meta httpEquiv="description" content={ description } />
                <title>{ title }</title>
                {
                    _.map(realCssList, (link, index) =>
                        <link key={ index } href={ _.startsWith(link, '//') || _.startsWith(link, 'http') ? link : `${webHost}${link}` } rel="stylesheet" media="screen" />
                    )
                }
                <script dangerouslySetInnerHTML={ {
                    __html: `
                        window.__SSR__ = ${ssr}
                        window.__INITIAL_STATE__ = ${jsonInitialState}
                        window.__NODE_ENV__ = '${nodeEnv}'
                        window.__APP_NAME__ = '${appName}'
                    `
                } }></script>
            </head>
            <body>
            <div id="__APP__" dangerouslySetInnerHTML={ {
                __html: appContent
            } }></div>
            {
                _.map(realJsList, (js, index) =>
                    <script key={ index } type="text/javascript" src={ _.startsWith(js, '//') || _.startsWith(js, 'http') ? js : `${webHost}${js}` }></script>
                )
            }
            </body>
        </html>
    )
}
