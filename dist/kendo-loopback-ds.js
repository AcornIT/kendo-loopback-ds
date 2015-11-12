/*! kendo-loopback-ds - 2015-10-29
* http://akera.io
* Author: Radu Nicoara
* Copyright (c) 2015 Acorn IT;
* SEE LICENSE IN <LICENSE> */
kendo.loopback = kendo.loopback || {};
kendo.loopback.Filter = {
    getClause: function(flt) {
        var clause = {};
        switch (flt.operator) {
            case 'eq':
                clause[flt.field] = flt.value;
                break;
            case 'neq':
                clause[flt.field] = {
                    neq: flt.value
                };
                break;
            case 'gte':
                clause[flt.field] = {
                    gte: flt.value
                };
                break;
            case 'lte':
                clause[flt.field] = {
                    lte: flt.value
                };
                break;
            case 'lt':
                clause[flt.field] = {
                    lt: flt.value
                };
                break;
            case 'gt':
                clause[flt.field] = {
                    gt: flt.value
                };
                break;
            case 'contains':
                clause[flt.field] = {
                    like: '*' + flt.value + '*'
                };
                break;
            case 'startswith':
                clause[flt.field] = {
                    like: flt.value + '*'
                };
                break;
            case 'endswith':
                clause[flt.field] = {
                    like: '*' + flt.value
                };
                break;
            default:
                throw new TypeError('Filter operator ' + flt.operator + ' is not supported.');
        }
        return clause;
    },
    recursiveFilter: function(filter) {
        var self = this;
        var lbFlt = {};
        if (filter.filters) {
            lbFlt[filter.logic] = [];
            filter.filters.forEach(function(flt) {
                lbFlt[filter.logic].push(self.recursiveFilter(flt));
            });
            return lbFlt;
        } else {
            return this.getClause(filter);
        }
    },
    convert: function convert(filter, update) {
        var lbFilter = this.recursiveFilter(filter);
        return update === true ? lbFilter : {
            where: lbFilter
        };
    }
};

if (!jQuery) {
    throw new Error('kendo.loopback requires jQuery!');
}
kendo.loopback = kendo.loopback || {};

var LoopbackTransport = function(lbModel) {
    if (!lbModel) {
        throw new Error('Invalid loopback model specified');
    }
    this.lbModel = lbModel;
};

jQuery.extend(true, LoopbackTransport.prototype, {
    read: function(options) {
            var lbModel = this.lbModel;
            var filter = {};
            var self = this;
            filter.limit = options.data.pageSize || null;
            if (this.dataSource.options.serverPaging === true && options.data.page && options.data.page > 1) {
                filter.offset = options.data.skip + 1;
            }
            if (this.dataSource.options.serverSorting === true && options.data.sort) {
                filter.order = [];
                options.data.sort.forEach(function(sort) {
                    filter.order.push(sort.field + ' ' + sort.dir.toUpperCase());
                });
            }
            if (this.dataSource.options.serverFiltering === true && options.data.filter) {
                jQuery.extend(true, filter, kendo.loopback.Filter.convert(options.data.filter, false));
            }
            lbModel.find({
                filter: filter
            }).$promise.then(function(rs) {
                if (self.dataSource.options.serverPaging === true) {
                    lbModel.count({
                        where: filter.where
                    }).$promise.then(function(resp) {
                        rs[self.dataSource.options.schema.total] = resp.count;
                        options.success(rs);
                    });
                } else {
                    options.success(rs);
                }
            });
        }
        //TODO: Implement CUD operations
});

kendo.loopback.DataSource = kendo.data.DataSource.extend({
    init: function(options) {
        if (!options.lbModel) {
            throw new Error('Invalid loopback model specified');
        }
        var transport = new LoopbackTransport(options.lbModel);
        transport.dataSource = this;
        options.transport = transport;
        options.serverFiltering = options.serverFiltering || true;
        options.serverPaging = options.serverPaging || true;
        options.serverSorting = options.serverSorting || true;
        options.schema = options.schema || {};
        options.schema.total = options.schema.total || 'count';
        kendo.data.DataSource.fn.init.call(this, options);
    }
});
