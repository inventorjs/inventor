/**
 * database 服务提供者
 *
 * @author : sunkeysun
 */

import Provider from '../support/base/Provider'
import Sequelize from 'sequelize'

export default class DatabaseProvider extends Provider {
    staticKey = '$'

    register() {
        const databaseConfig = app().config('database')
        const dbs = {}

        _.each(databaseConfig, (config, dbName) => {
            if (dbName === '$') {
                throw new Error(`database instance name [${this.staticKey}] is not allowed`)
            }
            const {
                driver, host, port, database, username, password, options={},
            } = config

            if (!driver) {
                return false
            }

            const Op = Sequelize.Op

            const realOptions = {
                ...options,
                dialect: driver,
                host: host,
                port: port,
                freezeTableName: true,
            }

            dbs[dbName] = new Sequelize(database, username, password, realOptions)

            dbs[dbName].authenticate()
                .then(() => {
                    app().logger.info(`database [${dbName}] connect success`, 'database')
                    app().emit(app().event('database-connect'), databaseConfig)
                })
                .catch((e) => {
                    app().logger.error(`database [${dbName}] connect error : ${e}`, 'database')
                    app().emit(app().event('database-error'), e, databaseConfig)
                })
        })

        dbs[this.staticKey] = Sequelize

        return dbs
    }
}
