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
                throw new IException(`database instance name [${this.staticKey}] is not allowed`)
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
                operatorsAliases: {
                    $eq: Op.eq,
                    $ne: Op.ne,
                    $gte: Op.gte,
                    $gt: Op.gt,
                    $lte: Op.lte,
                    $lt: Op.lt,
                    $not: Op.not,
                    $in: Op.in,
                    $notIn: Op.notIn,
                    $is: Op.is,
                    $like: Op.like,
                    $notLike: Op.notLike,
                    $iLike: Op.iLike,
                    $notILike: Op.notILike,
                    $regexp: Op.regexp,
                    $notRegexp: Op.notRegexp,
                    $iRegexp: Op.iRegexp,
                    $notIRegexp: Op.notIRegexp,
                    $between: Op.between,
                    $notBetween: Op.notBetween,
                    $overlap: Op.overlap,
                    $contains: Op.contains,
                    $contained: Op.contained,
                    $adjacent: Op.adjacent,
                    $strictLeft: Op.strictLeft,
                    $strictRight: Op.strictRight,
                    $noExtendRight: Op.noExtendRight,
                    $noExtendLeft: Op.noExtendLeft,
                    $and: Op.and,
                    $or: Op.or,
                    $any: Op.any,
                    $all: Op.all,
                    $values: Op.values,
                    $col: Op.col,
                },
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
