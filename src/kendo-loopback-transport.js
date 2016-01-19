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

LoopbackTransport.prototype = {
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
    },
    create: function(options) {
        var lbModel = this.lbModel;
        var idField = this.dataSource.options.schema.model.id;
        var itm = options.data;
        var newItm = {};
        for (var k in itm) {
            if (k !== idField) {
                newItm[k] = itm[k];
            }
        }
        lbModel.create(newItm).$promise.then(function(rs) {
            rs.$promise = null;
            options.success(rs);
        }, function(err) {
            options.error(err);
        });
    },
    update: function(options) {
        var idFilter = {};
        var idField = this.dataSource.options.schema.model.id;
        idFilter[idField] = options.data[idField];
        this.lbModel.prototype$updateAttributes(idFilter, options.data).$promise.then(function(rs) {
            var itm = {};
            itm.prototype = {};
            jQuery.extend(true, itm.prototype, rs.prototype);
            for (var k in rs) {
                if (k !== '$promise' && k !== '_events' && k !== '$resolved' && k !== 'dirty') {
                    itm[k] = rs[k];
                }
            }
            options.success(itm);
        }, function(err) {
            options.error(err);
        });
    },
    delete: function(options) {
            var idFilter = {};
            var idField = this.dataSource.options.schema.model.id;
            idFilter[idField] = options.data[idField];
            this.lbModel.deleteById(idFilter).$promise.then(function(rs) {
                options.success(rs);
            }, function(err) {
                options.error(err);
            });
        }
};

kendo.loopback.Transport = LoopbackTransport;
