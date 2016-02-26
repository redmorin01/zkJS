Array.prototype.each = function(func, args){ return zk().toolbox().each(this, func, args) };

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
    return paramFunc ? paramFunc(this, param) : "";
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
    return paramFunc ? paramFunc(this, param) : "";
};


var arrayGetBeforePath = "_ENTITY_._PARAMETERS_.array.getBefore.";
zk().setContainer(arrayGetBeforePath+"number", function(el, param){ return el.slice(0,Math.abs(param)) });
zk().setContainer(arrayGetBeforePath+"string", function(el, param){
    return zk().getContainer(arrayGetBeforePath+"regexp")(el, new RegExp(param));
});
zk().setContainer(arrayGetBeforePath+"regexp", function(el, param){
    var k = el.length;
    for(var i = (k-1); i+1 ; i--){
        if(param.test(el[i])){
            return el.slice(0,i);
        }
    }
    return [];
});
Array.prototype.getBefore = function(param){
    if(param===undefined){param=1}
    var paramFunc = zk().getContainer(arrayGetBeforePath+zk().toolbox().is(param));
    return paramFunc ? paramFunc(this, param) : "";
};








var stringGetAfterPath = "_ENTITY_._PARAMETERS_.string.getAfter.";
zk().setContainer(stringGetAfterPath + "string", function (el, param) {
    param = el.match(param);
    if (!param) { return '' }
    param = param[0];
    var i = el.search(param); i += param.length - 1;
    return zk().getContainer(stringGetAfterPath + "number")(el, i);
});
zk().setContainer(stringGetAfterPath+"regexp", function(el, param){
    (''+param).replace(/^\/(.*)\/([gi]*)$/, function(str, s1, s2){ param = new RegExp(s1, s2.trim("g")+"g") });
    return zk().getContainer(stringGetAfterPath + "string")(el, param);
});
zk().setContainer(stringGetAfterPath + "number", function (el, param) { return el.slice(Math.abs(param) + 1) });
Array.prototype.getAfter = function(param){
    if(param===undefined){ return "" }
    var paramFunc = zk().getContainer(stringGetAfterPath+zk().toolbox().is(param));
    return paramFunc ? paramFunc(this, param) : "";
};

var stringGetBetweenPath = "_ENTITY_._PARAMETERS_.string.getBetween.";
zk().setContainer(stringGetBetweenPath + "array", function (el, param) {
    var i, t, k, res = "";
    k = param.length;
    for (i = 0; i < k; i += 2) {
        t = [Math.abs(param[i]), Math.abs(param[i + 1])];
        if(isNaN(t[1])){ t[1] = el.length }
        if (zk().toolbox().is(t[0], 'number') && zk().toolbox().is(t[1], 'number')) {
            t = zk().toolbox().nSort(t);
            res = res.concat(el.slice(t[0] + 1, t[1]))
        }
    }
    return res
});
Array.prototype.getBetween = function(param){
    if(param===undefined){ return "" }
    var paramFunc = zk().getContainer(stringGetBetweenPath+zk().toolbox().is(param));
    return paramFunc ? paramFunc(this, param) : "";
};

var stringGetAtPath = "_ENTITY_._PARAMETERS_.string.getAt.";
zk().setContainer(stringGetAtPath + "array", function (el, param) {
    var n, k = el.length, res = '';
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
zk().setContainer(stringGetAtPath + "number", function (el, param) { return zk().getContainer(stringGetAtPath + "array")(el, [param]) });
Array.prototype.getAt = function(param){
    if(param===undefined){ return "" }
    var paramFunc = zk().getContainer(stringGetAtPath+zk().toolbox().is(param));
    return paramFunc ? paramFunc(this, param) : "";
};

var stringGetPath = "_ENTITY_._PARAMETERS_.string.get.";
/**
 *  Pour un argument de type string :
 *  Renvoie le résultat dans un tableau
 */
zk().setContainer(stringGetPath+"string", function(el, param){
    var res = el.match(new RegExp(param, 'g'));
    return res ? res : [];
});
/**
 *  Pour un argument de type regexp :
 *  Renvoie le résultat dans un tableau
 */
zk().setContainer(stringGetPath+"regexp", function(el, param){
    (''+param).replace(/^\/(.*)\/([gi]*)$/, function(str, s1, s2){ param = new RegExp(s1, s2.trim("g")+"g") });
    var res = el.match(param);
    return res ? res : [];
});
/**
 * Pour un argument de type number :
 * - Renvoie les premiers résultats si l'argument <param> est positif
 * - Sinon renvoie les derniers éléments
 */
zk().setContainer(stringGetPath + "number", function (el, param) { return ( param < 0 ) ? el.slice(param) : el.slice(0, param); });
/**
 * Pour un argument de type array :
 * Le résulat est obtenu en fonction du type des éléments qui se trouve dans le tableau
 */
zk().setContainer(stringGetPath + "array", function (el, param) {
    var res = [];
    zk().toolbox().each(param, function () {
        var paramFunc = zk().getContainer(stringGetPath+zk().toolbox().is(this.v));
        if (paramFunc) {
            var r = paramFunc(el, this.v);
            if(r){ res = res.concat(r) }
        }
    });
    return res
});
Array.prototype.get = function(param){
    if(param===undefined){ return "" }
    var paramFunc = zk().getContainer("_ENTITY_._PARAMETERS_.string.get."+zk().toolbox().is(param));
    return paramFunc ? paramFunc(this, param) : "";
};




