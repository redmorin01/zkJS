/**
 * Permet de supprimer des caractères au début et à la fin d'une chaîne
 * @param strReg
 *      Par exemple : "[abg]", "a|b|c"
 * @returns {string}
 */
String.prototype.trim = function(strReg){ return zk().toolbox().trim(this, strReg) };
String.prototype.each = function(func, args){ return zk().toolbox().each(this, func, args) };

var stringIndexPath = "_ENTITY_._PARAMETERS_.string.index.";
zk().setContainer(stringIndexPath+"string", function(el, param){
    return zk().getContainer(stringIndexPath+"regexp")(el, new RegExp(param));
});
zk().setContainer(stringIndexPath+"regexp", function(el, param){
    var k = el.length;
    for(var i = 0; i < k ; i++){
        if(param.test(el[i])){
            return i;
        }
    }
    return null;
});
String.prototype.index = function(param){
    if(param===undefined){param=1}
    var paramFunc = zk().getContainer(stringIndexPath+zk().toolbox().is(param));
    return paramFunc ? paramFunc(this, param) : "";
};

var stringCountPath = "_ENTITY_._PARAMETERS_.string.count.";
zk().setContainer(stringCountPath+"string", function(el, param){
    return zk().getContainer(stringCountPath+"regexp")(el, new RegExp(param));
});
zk().setContainer(stringCountPath+"regexp", function(el, param){
    var count = 0;
    zk().toolbox().each(el,function(){
        if(param.test(this.v)){
            count++;
        }
    });
    return count;
});
String.prototype.count = function(param){
    if(param===undefined){param=1}
    var paramFunc = zk().getContainer(stringCountPath+zk().toolbox().is(param));
    return paramFunc ? paramFunc(this, param) : "";
};


var stringGetFirstPath = "_ENTITY_._PARAMETERS_.string.getFirst.";
zk().setContainer(stringGetFirstPath+"regexp", function(el, param){ var r = el.match(param); return r ? r[0] : ''; });
zk().setContainer(stringGetFirstPath+"number", function(el, param){ return el.slice(0, Math.abs(param)) });
String.prototype.getFirst = function(param){
    if(param===undefined){param=1}
    var paramFunc = zk().getContainer(stringGetFirstPath+zk().toolbox().is(param));
    return paramFunc ? paramFunc(this, param) : "";
};

String.prototype.getMiddle = function(){
    var l = this.length, n = parseInt(l / 2);
    return (l % 2) ? this.slice(n, n + 1) : this.slice(n - 1, n + 1)
};

var stringGetLastPath = "_ENTITY_._PARAMETERS_.string.getLast.";
zk().setContainer(stringGetLastPath+"regexp", function(el, param){
    (''+param).replace(/^\/(.*)\/([gi]*)$/, function(str, s1, s2){
        param = new RegExp(s1, s2.trim("g")+"g");
    });
    var r = el.match(param);
    return r ? r[r.length - 1] : '';
});
zk().setContainer(stringGetLastPath+"number", function(el, param){ return el.slice(-param) });
String.prototype.getLast = function(param){
    if(param===undefined){param=1}
    var paramFunc = zk().getContainer(stringGetLastPath+zk().toolbox().is(param));
    return paramFunc ? paramFunc(this, param) : "";
};

var stringGetBeforePath = "_ENTITY_._PARAMETERS_.string.getBefore.";
zk().setContainer(stringGetBeforePath + "string", function (el, param) {
    param = el.match(param);
    if (!param) { return '' }
    param = param[0];
    var i = el.search(param);
    return zk().getContainer(stringGetBeforePath + "number")(el, i);
});
zk().setContainer(stringGetBeforePath+"regexp", function(el, param){
    (''+param).replace(/^\/(.*)\/([gi]*)$/, function(str, s1, s2){ param = new RegExp(s1, s2.trim("g")+"g") });
    return zk().getContainer(stringGetBeforePath + "string")(el, param);
});
zk().setContainer(stringGetBeforePath + "number", function (el, param) { return el.slice(0, Math.abs(param)) });
String.prototype.getBefore = function(param){
    if(param===undefined){ return "" }
    var paramFunc = zk().getContainer(stringGetBeforePath+zk().toolbox().is(param));
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
String.prototype.getAfter = function(param){
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
String.prototype.getBetween = function(param){
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
String.prototype.getAt = function(param){
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
String.prototype.get = function(param){
    if(param===undefined){ return "" }
    var paramFunc = zk().getContainer("_ENTITY_._PARAMETERS_.string.get."+zk().toolbox().is(param));
    return paramFunc ? paramFunc(this, param) : "";
};




