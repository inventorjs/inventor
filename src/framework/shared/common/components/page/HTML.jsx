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
        appName='',
        appContent='',
        sharedPath='',
        ssr=false,
    } = props

    const { jsList: vendorJsList=[], cssList: vendorCssList=[] } = require(`${sharedPath}/vendor/addon`)
    const { jsList: commonJsList=[], cssList: commonCssList=[] } = require(`${sharedPath}/common/addon`)
    const { jsList=[], cssList=[] } = require(`${sharedPath}/apps/${appName}/addon`)

    const realJsList = vendorJsList.concat(commonJsList).concat(jsList)
    const realCssList = vendorCssList.concat(commonCssList).concat(cssList)

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
                        <link key={ index } href={ link } rel="stylesheet" media="screen" />
                    )
                }
                <script dangerouslySetInnerHTML={ {
                    __html: `
                        window.__SSR__ = ${ssr}
                        window.__INITIAL_STATE__ = ${jsonInitialState}
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
                    <script key={ index } type="text/javascript" src={ js }></script>
                )
            }
            </body>
        </html>
    )
}

