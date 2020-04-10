module.exports = {
    randomID: n => {
        // https://stackoverflow.com/a/48031564/10015942
        let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let token = '';
        for (let i = 0; i < n; i++) {
            token += chars [Math.floor (Math.random () * chars.length)];
        }
        return token;
    }
}