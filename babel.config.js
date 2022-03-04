module.exports = function(api) {
    api.cache.never()

    return {
        presets: [
            ['@babel/preset-env', {
                targets: { node: '12.16.0' }
            }],
        ],
        plugins: [
            ['@babel/plugin-transform-runtime'],
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            ['@babel/plugin-proposal-class-properties'],
            '@babel/plugin-proposal-export-default-from',
            '@babel/plugin-proposal-export-namespace-from',
        ]
    }
}
