Array.prototype.each = function(func, args){ return zk().toolbox().each(this, func, args) };



var arrayIndexPath = "_ENTITY_._PARAMETERS_.array.index.";
/**
 *  Pour un argument de type number :
 * Le résulat est un nombre correspondant à l'index de l'élément recherché
 */
zk().setContainer(arrayIndexPath+"number", function(el, param){
    var k = el.length;
    for(var i=0; i < k; i++){
        if(el[i] === param){
            return i;
        }
    }
    return null;
});
zk().setContainer(arrayIndexPath+"string", function(el, param){
    return zk().getContainer(arrayIndexPath+"regexp")(el, new RegExp(param));
});
zk().setContainer(arrayIndexPath+"regexp", function(el, param){
    var k = el.length;
    for(var i = 0; i < k ; i++){
        if(param.test(el[i])){
            return i;
        }
    }
    return null;
});
Array.prototype.index = function(param){
    if(param===undefined){param=1}
    var paramFunc = zk().getContainer(arrayIndexPath+zk().toolbox().is(param));
    return paramFunc ? paramFunc(this, param) : [];
};

var arrayCountPath = "_ENTITY_._PARAMETERS_.array.count.";
zk().setContainer(arrayCountPath+"number", function(el, param){
    var count = 0;
    zk().toolbox().each(el,function(){
        if(this.v === param){
            count++;
        }
    });
    return count;
});
zk().setContainer(arrayCountPath+"string", function(el, param){
    return zk().getContainer(arrayCountPath+"regexp")(el, new RegExp(param));
});
zk().setContainer(arrayCountPath+"regexp", function(el, param){
    var count = 0;
    zk().toolbox().each(el,function(){
        if(param.test(this.v)){
            count++;
        }
    });
    return count;
});
Array.prototype.count = function(param){
    if(param===undefined){param=1}
    var paramFunc = zk().getContainer(arrayCountPath+zk().toolbox().is(param));
    return paramFunc ? paramFunc(this, param) : [];
};


Array.prototype.has = function(param){
    if(param===undefined){param=1}
    var paramFunc = zk().getContainer(arrayIndexPath+zk().toolbox().is(param));
    var ok =  paramFunc ? paramFunc(this, param) : false;
    return zk().toolbox().is(ok,"number") ? true : false;
};


var arrayGetFirstPath = "_ENTITY_._PARAMETERS_.array.getFirst.";
zk().setContainer(arrayGetFirstPath+"number", function(el, param){ return el.slice(0, Math.abs(param)) });
zk().setContainer(arrayGetFirstPath+"string", function(el, param){
    return zk().getContainer(arrayGetFirstPath+"regexp")(el, new RegExp(param));
});
zk().setContainer(arrayGetFirstPath+"regexp", function(el, param){
    var k = el.length;
    for(var i = 0; i < k; i++){
        if(param.test(el[i])){
            return [el[i]];
        }
    }
    return [];
});
Array.prototype.getFirst = function(param){
    if(param===undefined){param=1}
    var paramFunc = zk().getContainer(arrayGetFirstPath+zk().toolbox().is(param));
    return paramFunc ? paramFunc(this, param) : [];
};

Array.prototype.getMiddle = function(){
    var l = this.length, n = parseInt(l / 2);
    return (l % 2) ? this.slice(n, n + 1) : this.slice(n - 1, n + 1)
};

var arrayGetLastPath = "_ENTITY_._PARAMETERS_.array.getLast.";
zk().setContainer(arrayGetLastPath+"number", function(el, param){ return el.slice(-Math.abs(param)) });
zk().setContainer(arrayGetLastPath+"string", function(el, param){
    return zk().getContainer(arrayGetLastPath+"regexp")(el, new RegExp(param));
});
zk().setContainer(arrayGetLastPath+"regexp", function(el, param){
    var k = el.length;
    for(var i = (k-1); i+1 ; i--){
        if(param.test(el[i])){
            return [el[i]];
        }
    }
    return [];
});
Array.prototype.getLast = function(param){
    if(param===undefined){param=1}
    var paramFunc = zk().getContainer(arrayGetLastPath+zk().toolbox().is(param));
    return paramFunc ? paramFunc(this, param) : [];
};

var arrayGetBeforePath = "_ENTITY_._PARAMETERS_.array.getBefore.";
zk().setContainer(arrayGetBeforePath+"number", function(el, param){ return el.slice(0,Math.abs(param)) });
zk().setContainer(arrayGetBeforePath+"string", function(el, param){
    return zk().getContainer(arrayGetBeforePath+"regexp")(el, new RegExp(param));
});
zk().setContainer(arrayGetBeforePath+"regexp", function(el, param){
    var k = el.length;
    for(var i = 0; i < k ; i++){
        if(param.test(el[i])){
            return el.slice(0,i);
        }
    }
    return [];
});
Array.prototype.getBefore = function(param){
    if(param===undefined){param=1}
    var paramFunc = zk().getContainer(arrayGetBeforePath+zk().toolbox().is(param));
    return paramFunc ? paramFunc(this, param) : [];
};

var arrayGetAfterPath = "_ENTITY_._PARAMETERS_.array.getAfter.";
zk().setContainer(arrayGetAfterPath+"number", function(el, param){ return el.slice(Math.abs(param)+1) });
zk().setContainer(arrayGetAfterPath+"string", function(el, param){
    return zk().getContainer(arrayGetAfterPath+"regexp")(el, new RegExp(param));
});
zk().setContainer(arrayGetAfterPath+"regexp", function(el, param){
    var k = el.length;
    for(var i = 0; i < k ; i++){
        if(param.test(el[i])){
            return el.slice(i+1);
        }
    }
    return [];
});
Array.prototype.getAfter = function(param){
    if(param===undefined){param=1}
    var paramFunc = zk().getContainer(arrayGetAfterPath+zk().toolbox().is(param));
    return paramFunc ? paramFunc(this, param) : [];
};

var arrayGetBetweenPath = "_ENTITY_._PARAMETERS_.array.getBetween.";

var doArrayGetBetweenByObj = {
    "number": function(el,param){
        return Math.abs(param);
    },
    "string": function(el,param){
        return zk().getContainer(arrayIndexPath+"string")(el,param);
    },
    "regexp": function(el,param){
        return zk().getContainer(arrayIndexPath+"regexp")(el,param);
    }
};
/**
 * Pour un argument de type array :
 * Renvoie un tableau contenant les cases du tableau el entre deux valeur (string,regexp,number)
 */
zk().setContainer(arrayGetBetweenPath+"array", function(el, param){
    var i, t, k, res = [];
    k = param.length;
    for (i = 0; i < k; i += 2) {
        var first = zk().toolbox().is(param[i]);
        var second = zk().toolbox().is(param[i+1]);
        if(doArrayGetBetweenByObj.hasOwnProperty(first) && doArrayGetBetweenByObj.hasOwnProperty(second)){
            first = doArrayGetBetweenByObj[first](el,param[i]);
            second = doArrayGetBetweenByObj[second](el,param[i+1]);
            var tab = [first, second].sort();
            res = res.concat(el.slice(tab[0]+1,tab[1]));
        }
    }
    return res;
});

Array.prototype.getBetween = function(param){
    if(param===undefined){param=1}
    var paramFunc = zk().getContainer(arrayGetBetweenPath+zk().toolbox().is(param));
    return paramFunc ? paramFunc(this, param) : "";
};


var arrayGetAtPath = "_ENTITY_._PARAMETERS_.array.getAt.";
zk().setContainer(arrayGetAtPath + "number", function (el, param) { return zk().getContainer(arrayGetAtPath + "array")(el, [param]) });
zk().setContainer(arrayGetAtPath + "array", function (el, param) {
    var n, k = el.length, res = [];
    zk().toolbox().each(param, function () {
        n = Math.abs(this.v);
        if (zk().toolbox().is(n, 'number')) {
            if (n < k) {
                res = res.concat(el[n])
            }
        }
    });
    return res
});
Array.prototype.getAt = function(param){
    if(param===undefined){ return [] }
    var paramFunc = zk().getContainer(arrayGetAtPath+zk().toolbox().is(param));
    return paramFunc ? paramFunc(this, param) : [];
};

var arrayGetPath = "_ENTITY_._PARAMETERS_.array.get.";
/**
 *  Pour un argument de type string :
 *  Renvoie le résultat dans un tableau
 */
zk().setContainer(arrayGetPath+"string", function(el, param){
  return zk().getContainer(arrayGetPath+"regexp")(el,new RegExp(param));
});
/**
 *  Pour un argument de type regexp :
 *  Renvoie le résultat dans un tableau
 */
zk().setContainer(arrayGetPath+"regexp", function(el, param){
    var res = [];
    zk().toolbox().each(el,function(){
        if(param.test(this.v)){
            res.push(this.v);
        }
    });
    return res;
});
/**
 * Pour un argument de type number :
 * - Renvoie les premiers résultats si l'argument <param> est positif
 * - Sinon renvoie les derniers éléments
 */
zk().setContainer(arrayGetPath + "number", function (el, param) { return ( param < 0 ) ? el.slice(param) : el.slice(0, param); });
/**
 * Pour un argument de type array :
 * Le résulat est obtenu en fonction du type des éléments qui se trouve dans le tableau
 */
zk().setContainer(arrayGetPath + "array", function (el, param) {
    var res = [];
    zk().toolbox().each(param, function () {
        var paramFunc = zk().getContainer(arrayGetPath+zk().toolbox().is(this.v));
        if (paramFunc) {
            var r = paramFunc(el, this.v);
            if(r){ res = res.concat(r) }
        }
    });
    return res
});
Array.prototype.get = function(param){
    if(param===undefined){ return [] }
    var paramFunc = zk().getContainer("_ENTITY_._PARAMETERS_.array.get."+zk().toolbox().is(param));
    return paramFunc ? paramFunc(this, param) : "";
};




