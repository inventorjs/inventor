module.exports = function(api) {
    api.cache.never()

    return {
        presets: [
            ['@babel/preset-env', {
                targets: { node: '8.14.0' }
            }]
        ],
        plugins: [
            ['@babel/plugin-transform-runtime', { regenerator: false }],
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            ['@babel/plugin-proposal-class-properties', { loose: true }],
            '@babel/plugin-proposal-export-default-from',
            '@babel/plugin-proposal-export-namespace-from',
        ]
    }
}
