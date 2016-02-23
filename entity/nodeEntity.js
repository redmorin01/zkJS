var methods = {

    "getFirst": function(param){
        if(param===undefined){param=1}
        //console.log(param);
    return this.parameter("getFirst."+zk().tool().is(param));
    },

    "getMiddle": function(el){
        var l = el.length, n = parseInt(l / 2);
        return (l % 2) ? el.slice(n, n + 1) : el.slice(n - 1, n + 1)
    },

};

var parameters = {
    "getFirst.string": function(){

    },
    "getFirst.array": function(){},
    "getFirst.number": function(el, param){

        param = Math.abs(param);
        return el.slice(0, param)
    },
    "getFirst.regexp": function(){},

};


zk().register(function String($this, getParameter){
    this.get = function (opt) {
        if (opt === undefined) { return $this }
    };
    this.set = function (value) {
        if (value !== undefined) { return $this = value }
        return this;
    };
    this.set = function (value) {
        if (value !== undefined) { return $this = value }
        return this;
    };
    this.parameter = function (path) {
        return getParameter(path);
    };

}, methods, parameters);