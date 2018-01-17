export const jsList = [
    <% for(let index in htmlWebpackPlugin.files.js) { %>
    '<%- htmlWebpackPlugin.files.js[index] %>',
    <% } %>
]

export const cssList = [
    <% for(let index in htmlWebpackPlugin.files.css) { %>
    '<%- htmlWebpackPlugin.files.css[index] %>',
    <% } %>
]
