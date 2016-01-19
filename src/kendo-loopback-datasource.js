kendo.loopback = kendo.loopback || {};

function convertToKendo(schema) {
    var description = {
        name: schema.name,
        fields: {}
    };
    for (var field in schema.properties) {
        var fld = schema.properties[field];
        description.fields[field] = {
            nullable: !fld.required || false,
            editable: !(fld.id && fld.id === true)
        };

        if (fld.id === true) {
            description.id = field;
            delete description.fields[field].id;
        }
        delete description.fields[field].required;
    }
    return description;
}

kendo.loopback.DataSource = kendo.data.DataSource.extend({
    init: function(options) {
        if (!options.lbModel) {
            throw new Error('Invalid loopback model specified');
        }
        var transport = new kendo.loopback.Transport(options.lbModel);
        transport.dataSource = this;
        options.transport = transport;
        options.serverFiltering = options.serverFiltering === undefined ? true : options.serverFiltering;
        options.serverPaging = options.serverPaging === undefined ? true : options.serverPaging;
        options.serverSorting = options.serverSorting === undefined ? true : options.serverSorting;
        options.schema = options.schema || {};
        options.schema.model = convertToKendo(options.lbModel.schema);
        options.schema.total = options.schema.total || 'count';
        kendo.data.DataSource.fn.init.call(this, options);
    }
});
