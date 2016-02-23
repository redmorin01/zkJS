/**
 * Permet de supprimer des caractères au début et à la fin d'une chaîne
 * @param strReg
 *      Par exemple : "[abg]", "a|b|c"
 * @returns {string}
 */
String.prototype.trim = function(strReg){ return zk().tool().trim(this, strReg) };

var stringGetFirstPath = "_ENTITY_._PARAMETERS_.string.getFirst.";
zk().setContainer(stringGetFirstPath+"regexp", function(el, param){ var r = el.match(param); return r ? r[0] : ''; });
zk().setContainer(stringGetFirstPath+"number", function(el, param){ return el.slice(0, Math.abs(param)) });
String.prototype.getFirst = function(param){
    if(param===undefined){param=1}
    var paramFunc = zk().getContainer("_ENTITY_._PARAMETERS_.string.getFirst."+zk().tool().is(param));
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
    var paramFunc = zk().getContainer("_ENTITY_._PARAMETERS_.string.getLast."+zk().tool().is(param));
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
    var paramFunc = zk().getContainer("_ENTITY_._PARAMETERS_.string.getBefore."+zk().tool().is(param));
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
    var paramFunc = zk().getContainer("_ENTITY_._PARAMETERS_.string.getAfter."+zk().tool().is(param));
    return paramFunc ? paramFunc(this, param) : "";
};

var stringGetBetweenPath = "_ENTITY_._PARAMETERS_.string.getBetween.";
zk().setContainer(stringGetBetweenPath + "array", function (el, param) {
    var i, t, k, res = "";
    k = param.length;
    for (i = 0; i < k; i += 2) {
        t = [Math.abs(param[i]), Math.abs(param[i + 1])];
        if(isNaN(t[1])){ t[1] = el.length }
        if (zk().tool().is(t[0], 'number') && zk().tool().is(t[1], 'number')) {
            t = zk().tool().nSort(t);
            res = res.concat(el.slice(t[0] + 1, t[1]))
        }
    }
    return res
});
String.prototype.getBetween = function(param){
    if(param===undefined){ return "" }
    var paramFunc = zk().getContainer("_ENTITY_._PARAMETERS_.string.getBetween."+zk().tool().is(param));
    return paramFunc ? paramFunc(this, param) : "";
};