var methods = {

    "getFirst": function(param){
        if(param===undefined){param=1}
        //console.log(param);
    return this.parameter("getFirst."+zk().toolbox().is(param))(this,param);
    },

    "getMiddle": function(el){
        var l = el.length, n = parseInt(l / 2);
        return (l % 2) ? el.slice(n, n + 1) : el.slice(n - 1, n + 1)
    },

};

var parameters = {
    "getFirst.number": function($this, param){
        var nodes = $this.get(), res = [];
        zk().toolbox().each(nodes, function(){
            var children = zk().toolbox().toArray(this.v.children);
            res = res.concat(zk().getContainer(arrayGetFirstPath+"number")(children,param));
        });
        $this.set(res);
        return $this;
    },
    "getFirst.string": function($this, param){
        var nodes = $this.get(), res = [];
        zk().toolbox().each(nodes, function(){
            var first = this.v.querySelector(param);
            if(first){res.push(first)}
        });
        $this.set(res);
        return $this;
    },
    "getFirst.array": function(){},
    "getFirst.regexp": function(){},

};


zk().register(function Node($this, getParameter){
    this.get = function (opt) {
        if (opt === undefined) { return $this }
    };
    this.set = function (value) {
        if (value !== undefined) { return $this = value }
        return this;
    };
    this.parameter = function (path) {
        return getParameter(path);
    };

}, methods, parameters);