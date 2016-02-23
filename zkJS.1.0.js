(function () {
    'use strict';

    /**
     *  Services à créer :
     *      - SCROLL
     */

        function zk($W, $D) {
            /*  $W = window
             *  $D = document
             *
             *  ATTENTION :
             *      - Object.freeze : Vérifier si c'est compatible avec les mobiles
             *      - arguments : Obsolète, utiliser call
             */

            var THIS = this, ZKID = parseInt(Math.random() * 100000000000), NODEID = 1;

            // Permet de récupérer un service partout
            $W.zk = function (name) { return $GET(name) };

            if($W.$){
                $W.$$ = function (sel) { return $GET('NODE').$(sel) };
            } else {
                $W.$ = function (sel) { return $GET('NODE').$(sel) };
            }


            // ============= Fonctions importantes ==========================
            /**
             * Elle permet de travailler sur les types
             * @param el
             * @param type {RegExp/String}
             * @returns {*}
             */
            function is(el, type) {
                if (el === null) { return null }
                var t = (typeof el).toLowerCase() ;
                if(t==='object'){
                    el = String(el.constructor).toLowerCase();
                    if(/^(?:function|object) ([a-z0-9-]+)\(?/.test(el)){
                        t = RegExp.$1 ;
                        if (/^html[a-z]*element$/.test(t)) { t = 'nodeelement' }
                    } else {
                        t = undefined
                    }
                }
                var type2 = type ;
                if(type !== undefined && type !== null){
                    if(!/\bregexp\b/i.test(String(type.constructor))){type2 = new RegExp('\\b'+type+'\\b','i')}
                }
                return (type === undefined || !t)?t:(type2.test(t))
            }
            var doEachByObj = {
                string: function (el, f, args, strIndex, node) {
                    var i, k, isOk, res = '', r, ob, strIndex2 = ' ' + strIndex + ' ';
                    k = el.length;
                    for (i = 0; i < k; i++) {
                        ob = {i: i, k: i, v: el[i], l: k, all: el};
                        if (node === ZKID) {
                            ob.node = el[i];
                            ob.name = trim(el[i].nodeName.toLowerCase(), '#')
                        }
                        //console.log(ob);
                        if (strIndex) {
                            isOk = RegExp(' 0*' + i + ' ').test(strIndex2);
                            if (isOk) {
                                r = el[i]
                            } else {
                                r = f.apply(ob, args);
                                if (r === undefined) {
                                    r = el[i]
                                }
                            }
                            if (is(el, 'array')) {
                                el[i] = r
                            } else {
                                res = res.concat(r)
                            }
                        } else {
                            r = f.apply(ob, args);
                            if (r === undefined) {
                                r = el[i]
                            }
                            if (is(el, 'array')) {
                                el[i] = r
                            } else {
                                res = res.concat(r)
                            }
                        }
                    }
                    return is(el, 'array') ? el : res;
                },
                number: function (el, f, args, strIndex) {
                    var i, isOk;
                    el = Math.abs(el);
                    for (i = 0; i < el; i++) {
                        if (strIndex) {
                            isOk = RegExp(' 0*' + i + ' ').test(' ' + strIndex + ' ');
                            if (!isOk) {
                                f.apply({i: i, all: el}, args)
                            }
                        } else {
                            f.apply({i: i, all: el}, args);
                        }
                    }
                    return el
                },
                array: function (el, f, args, strIndex, node) {
                    return doEachByObj.string(el, f, args, strIndex, node)
                },
                object: function (el, f, args, strIndex) {
                    var i, isOk, r, ob;
                    for (i in el) {
                        if (el.hasOwnProperty(i)) {
                            ob = {i: i, k: i, v: el[i], all: el};
                            if (strIndex) {
                                isOk = RegExp(' 0*' + i + ' ').test(' ' + strIndex + ' ');
                                if (isOk) {
                                    r = el[i];
                                } else {
                                    r = f.apply(ob, args);
                                    if (r === undefined) {
                                        r = el[i]
                                    }
                                }
                                el[i] = r;
                            } else {
                                r = f.apply(ob, args);
                                if (r === undefined) {
                                    r = el[i]
                                }
                                el[i] = r;
                            }
                        }
                    }
                    return el
                },
                // this.node = le noeud     this.name = Nom du noeud (p,body...)
                node: function (el, f, args, strIndex) {
                    el = doEachByObj.array(el.get(), f, args, strIndex, ZKID);
                    return $GET("NODE").$(el)
                },
                // this.node = le noeud     this.name = Nom du noeud (p,body...)
                nodeelement: function (el, f, args, strIndex) {
                    el = doEachByObj.array(toArray(el.childNodes), f, args, strIndex, ZKID);
                    return $GET("NODE").$(el)
                },
                // this.node = le noeud     this.name = Nom du noeud (p,body...)
                nodelist: function (el, f, args, strIndex) {
                    el = doEachByObj.array(toArray(el), f, args, strIndex);
                    return $GET("NODE").$(el)
                },
                // this.node = le noeud     this.name = Nom du noeud (p,body...)
                htmlcollection: function (el, f, args, strIndex) {
                    return doEachByObj.nodelist(el, f, args, strIndex)
                }
            };
            /**
             * Cette méthode permet de parcourir les objets qui sont dans doEachByObj.
             * La fonction en argument recoit l'objet this avec :
             *        - this.i : Index en cours
             *        - this.v : Valeur de l'index en cours
             *        - this.l : La taille totale de l'élément en cours. N'existe pour les objets litéraux
             *        - this.all : L'élément sur lequel la méthode s'applique
             * @param  {function} f        [Fonction à executer à chaque tour]
             * @param  {[Array/Other]} args      [Arguments à transmettre à la fonction]
             * @param  {[String]} strIndex [Les index ou les clés à ignorer séparé par des espaces]
             * @return {[Array/Object]}          Elle retourne l'objet sur lequel elle s'applique
             */
            function each(el, f, args, strIndex){
                if (is(f, 'function')) {
                    var t = is(el);
                    if (doEachByObj.hasOwnProperty(t)) {
                        if (args === undefined) {
                            args = []
                        }
                        if (!is(args, 'array')) {
                            args = [args]
                        }
                        el = doEachByObj[t](el, f, args, strIndex);
                    }
                }
                return el
            }
            function setProto(name, objF) { $GET('PROTO').on($GET('PROTO').functions(name, objF)[name]) }

        function freeze() {
                each(CONTAINER.SERVICES, function () {
                    return Object.freeze(this.v)
                })
            }
            var doKeysByObj = {
                string : function(el){ return Object.keys(el) },
                array : function(el){ return Object.keys(el) },
                object : function(el){ return Object.keys(el) },
                node: function (el, zkID) {
                    var res = []; el = (zkID===ZKID)?el:el.get();
                    each(el, function(){
                        res.push(this.v.nodeName.toLowerCase())
                    });
                    return res
                },
                nodeelement: function (el) {
                    return doKeysByObj.node([el], ZKID);
                },
                nodelist: function (el) {
                    return doKeysByObj.node(toArray(el), ZKID);
                },
                htmlcollection: function (el) {
                    return doKeysByObj.node(toArray(el), ZKID);
                },
            };
            function keys(obj, filter) {
                var t = is(obj), res = [];
                if(doKeysByObj.hasOwnProperty(t)){
                    obj = doKeysByObj[t](obj);
                }else{
                    obj = Object.keys(obj)
                }
                t = is(filter);
                if(t === 'string' || t === 'regexp'){
                    each(obj, function(){
                        if(t === 'string'){
                            if(this.v === filter){res.push(this.v)}
                        }else{
                            if(filter.test(this.v)){res.push(this.v)}
                        }
                    });
                }else{
                    res = obj
                }
                return res;
            }
            var doTrimByObj = {
                string: function (str, reg, isIgnore) {
                    if (str === undefined){str = ''}; str += '';
                    if (reg === undefined){reg = ' '};
                    reg = new RegExp('^(?:'+reg+')|(?:'+reg+')$', (isIgnore===true)?'gi':'g');
                    return str.replace(reg, '')
                }
            };
            /**
             * Pour supprimer le début et la fin d'une chaine
             * @param  {[string]} str           [La chaîne à trimer]
             * @param  {[string]} reg           Les caractères qu'on vaut supprimer
             * @param  {[string]} isIgnore      [On spécifie i pour ignorer la casse]
             * @return {[string]}               [La chaîne trimée]
             */
            function trim(str, reg, isIgnore) {
                var t = is(str);
                if (doTrimByObj.hasOwnProperty(t)) {
                    str = doTrimByObj[t](str, reg, isIgnore)
                }
                return str
            }
            function toArray(el) { return [].slice.call(el) }

        function ajustNb(nb, defaut) {
                if (nb === undefined) {
                    nb = defaut
                }
                return is(nb, 'array') ? nb : [nb]
            }
            function nSort(A) {
                return A.sort(function (a, b) {
                    if (a < b) {
                        return -1
                    } else if (a > b) {
                        return 1
                    } else {
                        return 0
                    }
                })
            }
            function nSortD(A) {
                return A.sort(function (a, b) {
                    if (a > b) {
                        return -1
                    } else if (a < b) {
                        return 1
                    } else {
                        return 0
                    }
                })
            }
            /**
             * Cette fonction permet de slicé un élément
             * @param  {[string/array]} el [Elément a slicer]
             * @param  {[int]} i1 [Slice de 0 à i1 exclus]
             * @param  {[int]} i2 [Slice de i2 à la fin]
             * @param  {[string/array]} v  [Valeur à ajouter à la plage slicé. Facultatif]
             * @return {[string/array]}    [Elément slicé]
             */
            function doSlice(el, i1, i2, v) {
                i1 = i1 || 0;
                i2 = i2 || i1;
                i1 = el.slice(0, i1);
                i2 = el.slice(i2);
                return (v !== undefined && !is(v, 'Boolean')) ? i1.concat(v).concat(i2) : i1.concat(i2)
            }
            function getNodeId(node) {
                if (!is(node, 'nodeelement')) {
                    return 0
                }
                var id = node.getAttribute('zk-id');
                return (/^[0-9]+$/.test(id)) ? parseInt(id, 10) : 0
            }
            function setNodeId(node) {
                if (!is(node, 'nodeelement')) {
                    return 0
                }
                var id, att;
                id = getNodeId(node);
                if (id) {
                    return id
                }
                NODEID++;
                node.setAttribute('zk-id', NODEID + '');
                return NODEID - 1
            }
            function giveMeNodes(el) {
                var t = is(el), res = [], types = {
                    node: function (el) {
                        return el.get()
                    },
                    nodeelement: function (el) {
                        return [el]
                    },
                    // Renvoie le service NODE
                    nodelist: function (el) {
                        return toArray(el)
                    },
                    // Renvoie le service NODE
                    htmlcollection: function (el) {
                        return toArray(el)
                    }
                };
                if (types.hasOwnProperty(t)) {
                    res = types[t](el)
                }
                return res
            }
            /**
             * Cette fonction permet de supprimer ou changer du texte à l'intérieur des éléments.
             * @param  {[node]} noeud     [Elément qui subit les modifications]
             * @param  {[RegExp]} reg       [Expression régulière]
             * @param  {[String]} changeVal [Si précisé, on change. Sinon on supprime]
             * @return {[node]}           [Elément après la modification]
             */
            function clearChangeIntoNode(node, reg, changeVal, UL) {
                var text, child = node.firstChild;
                changeVal = (changeVal === undefined) ? '' : changeVal;
                if(!is(reg,'regexp')){ reg = new RegExp(reg+'') }
                while (child) {
                    if (child.nodeType === 3) {
                        text = child.textContent;
                        text = text.replace(reg, function (str) {
                            return UL ? str['to' + UL + 'Case']() : changeVal;
                        });
                        child.textContent = text
                    }
                    if (child.nodeType === 1) {
                        clearChangeIntoNode(child, reg, changeVal, UL)
                    }
                    child = child.nextSibling
                }
                return node;
            }
            /**
             * Cette fonction permet de supprimer ou changer le nom d'un élément.
             * @param  {[node]} noeud     [Elément qui subit les modifications]
             * @param  {[String]} name       [Nom de l'élément à supprimer ou à changer]
             * @param  {[String]} newName [Si précisé, on change. Sinon on supprime]
             * @return {[node]}           [Elément après la modification]
             */
            function clearChangeNodeName(node, name, newName) {
                newName = (newName === undefined) ? '' : newName;
                var inner = node.innerHTML;
                inner = inner.replace(RegExp('(< *\/* *)(' + name + ')( *[^>]*>)', 'gi'), function (str, s1, s2, s3) {
                    return (newName === '') ? '' : (s1 + newName + s3);
                });
                node.innerHTML = inner;
                return node;
            }
            /**
             * Cette fonction permet d'insérer un élément après un autre
             * @param  {[node]} nouvEl  [Elément à ajouter]
             * @param  {[node]} afterEl [Elément après lequel l'insertion doit se faire]
             * @return {[node]}         [Elément mis à jour]
             */
            function insertAfter(nouvEl, afterEl) {
                var parent = afterEl.parentNode, next = afterEl.nextElementSibling;
                if (next) {
                    parent.insertBefore(nouvEl, next)
                } else {
                    parent.appendChild(nouvEl)
                }
                return parent;
            }
            function insertBefore(nouvEl, beforeEl) {
                var parent = beforeEl.parentNode;
                parent.insertBefore(nouvEl, beforeEl);
                return parent
            }
            /*
             * Elle permet de créer des éléments en utilisant le css
             *   - On utilise les crochets pour les attributs. Il ne faut pas d'espace entre les crochets
             *           Exemple : "div.myClass#myId[type=checkbox]"
             *
             * @return {Array}
             * */
            function createElementByCss(strElements) {
                var res = [];
                strElements = strElements.split(',');
                each(strElements, function () {
                    var strEls = trim(this.v).split(' '), node = null;
                    each(strEls, function () {
                        var strEl = this.v, attrs = {};
                        // Recherche de class et id
                        strEl = strEl.replace(/[\.#][^\.#\{\}\[\]]*/g, function (str) {
                            if (str[0] === '.') {
                                attrs.class = str.slice(1)
                            }
                            if (str[0] === '#') {
                                attrs.id = str.slice(1)
                            }
                            return ''
                        });
                        // Recherche pour les attributs
                        strEl = strEl.replace(/\[([a-z0-9-]+)=([a-z0-9-]+)\]/ig, function (str, s1, s2) {
                            attrs[s1] = s2;
                            return ''
                        });
                        strEl = trim(strEl, '#., ');
                        try {
                            var newNode = document.createElement(strEl)
                        } catch (e) {
                            newNode = null
                        }
                        if (newNode) {
                            each(attrs, function () {
                                newNode.setAttribute(this.i, this.v)
                            });
                            if (node) {
                                node.appendChild(newNode)
                            } else {
                                node = newNode
                            }
                        }
                    });
                    res.push(node)
                });
                return res
            }
            function querySelectorAll(node, cssSel) {
                try {
                    node = node.querySelectorAll(cssSel)
                } catch (e) {
                    node = []
                }
                return node
            }
            function querySelector(node, cssSel) {
                try {
                    node = node.querySelector(cssSel)
                } catch (e) {
                    node = null
                }
                return node
            }
            function nodeToString(node) {
                var container = document.createElement('div');
                container.appendChild(node);
                return container.innerHTML
            }
            var doRepeatByObj = {
                string: function (el, nb) {
                    nb = Math.abs(nb) ;
                    if(is(nb, 'number')){
                        var t = el ;
                        each(nb, function(){
                            el = el.concat(t)
                        }) ;
                    }
                    return el;
                },
                number: function (el, nb) { return Number(doRepeatByObj.string(el+'', nb)) },
                array: function (el, nb) { return doRepeatByObj.string(el, nb) },
                node: function (el, nb, f, args, zkID) {
                    el = (zkID===ZKID)?el:el.get();
                    var retour, type = is(nb);
                    if(/string|array|number|object/.test(type)){
                        if(type === 'string'){ nb = [nb] }
                        each(el, function(){
                            var node = this.v, after = node;
                            each(nb, function(){
                                var clone = node.cloneNode(true), html = this.v;
                                if(type === 'number'){ html = node.innerHTML }
                                if (f) {
                                    retour = f.apply({node: node, clone: clone, i: this.i, v: html, all: nb}, args);
                                    if (retour === undefined) { retour = html };
                                    html = retour;
                                }
                                clone.innerHTML = html;
                                insertAfter(clone, after);
                                after = clone;
                            });
                        });
                    }
                    return $GET("NODE").$(el);
                },
                nodeelement: function (el, nb, f, args) { return doRepeatByObj.node([el], nb, f, args, ZKID) },
                nodelist: function (el, nb, f, args) { return doRepeatByObj.node(toArray(el), nb, f, args, ZKID) },
                htmlcollection: function (el, nb, f, args) { return doRepeatByObj.node(toArray(el), nb, f, args, ZKID) }

            } ;
            function repeat(el, nb, f, args) {
                var t = is(el);
                if (doRepeatByObj.hasOwnProperty(t)) {
                    if(!is(f, 'function')){ f = false }
                    if(!is(args, 'array')){ args = [args] }
                    if (nb === undefined) { nb = 1 }
                    el = doRepeatByObj[t](el, nb, f, args);
                }
                return el;
            }
            function formatNumToStr(num, n) {
                num += ''; n = n - (num.length); if (n > 0) { num = repeat('0', n-1) + num }
                return num;
            }
            function cloneObject(obj) {
                if (obj === null){return obj}
                var copy = new obj.constructor(), id;
                for (id in obj) {
                    if (obj.hasOwnProperty(id)) {
                        copy[id] = obj[id];
                    }
                }
                return copy;
            }
            function round(el, nb){ return Math.floor(el) + (Math.round((el - Math.floor(el)) * Math.pow(10, nb)) / Math.pow(10, nb)) }

        // ===============================================================

            // Conteneur global de tous les objets
            var CONTAINER = {
                SERVICES: {},
                FIRST_SERVICES: {
                    NODE: function () { return new NODE() },
                    AJAX: function () { return new AJAX() },
                    DATE: function () { return new DATE() },
                    MAP: function () { return new MAP() },
                }
            };
            // Cette fonction permet d'obtenir un service (objet)
            function $GET(name) {
                var obj = CONTAINER;
                name = ('' + name).toUpperCase();
                if (obj.FIRST_SERVICES.hasOwnProperty(name)) {
                    return obj.FIRST_SERVICES[name]()
                }
                if (obj.SERVICES.hasOwnProperty(name)) {
                    return obj.SERVICES[name]
                }
                return null
            }

            // Cette fonction permet d'enregistrer un service (objet)
            function $SET(name, service) {
                var obj = CONTAINER.SERVICES;
                return obj[('' + name).toUpperCase()] = service
            }

            // Service CONFIG
            function CONFIG() {
                var This = this, flags = '', sep = ' ', lang = 'FR';
                var validLang = /FR|EN|US/i ;
                var days = {
                    FR: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
                    EN: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],

                } ;
                days.US = days.EN ;
                var months = {
                    FR: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                        'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
                    EN: ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'],
                };
                months.US = months.EN ;
                var dateConfig = {
                    reg: {
                        FR: /^(:?0?[1-9]|[12][0-9]|3[01])[\/ -](:?0?[1-9]|1[0-2])[\/ -][1-9][0-9]{3}$/,
                        EN: /^[1-9][0-9]{3}[\/ -](:?0?[1-9]|1[0-2])[\/ -](:?0?[1-9]|[12][0-9]|3[01])$/,
                    },
                    format: {
                        FR: '%dd/%mm/%yy',
                        EN: '%yy/%mm/%dd',
                    },

                };
                dateConfig.reg.US = dateConfig.reg.EN;
                dateConfig.format.US = dateConfig.format.EN;
                This.dateReg = function(reg){
                    if(reg === undefined){ return dateConfig.reg[lang] }
                    if(is(reg, 'regexp')){ dateConfig.reg[lang] = reg }
                    return This;
                };
                This.dateFormat = function(format){
                    if(format === undefined){ return dateConfig.format[lang] }
                    if(is(format, 'string')){ dateConfig.format[lang] = format }
                    return This;
                };
                This.flags = function (str) {
                    if (str === undefined) { return flags }
                    flags = (str + '').toLowerCase().replace(/[^gi]/g, '');
                    return This
                };
                This.sep = function (str) {
                    if (str === undefined) { return sep }
                    sep = (str + '')[0]
                    return This
                };
                This.lang = function (str) {
                    if (str === undefined) { return lang }
                    if (validLang.test(str)) { lang = (str + '').toUpperCase() }
                    return This
                };
                This.days = function (tab) {
                    if(tab === undefined){ return days[lang] }
                    if(is(tab, 'array') && tab.length === 7){
                        each(tab, function(){ return this.v + '' });
                        days[lang] = tab ;
                    }
                    return This
                };
                This.months = function (tab) {
                    if(tab === undefined){ return months[lang] }
                    if(is(tab, 'array') && tab.length === 12){
                        each(tab, function(){ return this.v + '' });
                        months[lang] = tab ;
                    }
                    return This
                };
            }
            $SET('CONFIG', new CONFIG());

            // Service PROTO
            function PROTO() {
                var This = this,
                    OBJS = [String, Array, Number, NODE, NodeList, HTMLElement, HTMLCollection],
                    functions = {},
                    objects = OBJS;
                /**
                 * Elle permet d'activer ou de désactiver les prototypes
                 * @param objs : Objet contenant Noms + Fonctions
                 *      zk("PROTO").on('foo', function(){ alert("ok !") });
                 *      zk("PROTO").off("GET"); // Désactivation de toutes les fonctions du services GET
                 *      zk("PROTO").off("TYPE", "is"); // Désactivation de la fonction du services TYPE
                 * @param fName
                 * @param off
                 * @returns {PROTO}
                 */
                This.on = function (objs, fName, off){
                    if (is(objs, 'string')) {
                        if(is(fName, 'function')){
                            var o = {}; o[objs] = fName; objs = o;
                        }else{
                            objs = objs.toUpperCase();
                            if (functions.hasOwnProperty(objs)) {
                                objs = functions[objs];
                                if(is(fName, 'string')){
                                    if (objs.hasOwnProperty(fName)) {
                                        var o = {}; o[fName] = objs[fName]; objs = o;
                                    }
                                }
                            }
                        }
                    }
                    if (is(objs, 'object')) {
                        each(objects, function () {
                            var p = this.v, n;
                            for (n in objs) {
                                if (objs.hasOwnProperty(n)) {
                                    if (off===ZKID) {
                                        if (p.prototype[n] === objs[n]) { delete p.prototype[n] }
                                    } else {
                                        if(!p.prototype[n]){ p.prototype[n] = objs[n] }
                                    }
                                }
                            }
                        });
                    }
                    return This;
                };
                This.off = function (objs, fName) { return This.on(objs, fName, ZKID) };
                /**
                 * Elle permet d'obtenir ou de définir les objets qui peuvent être prototypés.
                 * @param arrayObj : Tableau des objets qui seront prototypés
                 *              - si arrayObj==="*" alors objects = OBJS
                 * @param isNew : - true = Nouvelles données   - Sinon = Ajouter arrayObj
                 * @returns {*[]}
                 */
                This.objects = function (arrayObj, isNew) {
                    if (arrayObj === "*") { return objects = OBJS }
                    if (arrayObj === "**") { return objects = OBJS.concat([Object]) }
                    if (arrayObj) {
                        arrayObj = is(arrayObj, 'array') ? arrayObj : [arrayObj];
                        objects = (isNew === true) ? arrayObj : (objects.concat(arrayObj))
                    }
                    return objects
                };
                /**
                 * Elle permet d'obtenir ou de définir les fonctions prototypes.
                 * @param [serviceName]
                 * @param [objF]
                 * @returns {{TYPE: {is: Function}}}
                 */
                This.functions = function (serviceName, objF) {
                    if (is(serviceName, 'string')) {
                        serviceName = serviceName.toUpperCase();
                        if(objF === undefined){ return functions[serviceName] }
                        if(is(objF, 'object')){ functions[serviceName] = objF }
                    }
                    return functions
                }
                This.alias = function(fName, alias, serviceName){
                    if(is(serviceName, 'string')){
                        serviceName = serviceName.toUpperCase();
                        var f = functions[serviceName];
                        if(f.hasOwnProperty(fName)){
                            f[alias] = f[fName];
                            This.off(serviceName, fName);
                            This.on(alias, f[fName]);
                        }
                    } else {
                        each(functions, function(){
                            var f = this.v;
                            if(f.hasOwnProperty(fName)){
                                f[alias] = f[fName];
                                This.off(this.k, fName);
                                This.on(alias, f[fName]);
                            }
                        });
                    }
                    return This;
                };
            }
            $SET('PROTO', new PROTO());

            // Service TYPE
            function TYPE() {
                var This = this, TF = {}, PR = $GET('PROTO');
                This.is = function (el, type) { return is(el, type) };
                TF.is = function (type) { return is(this, type) };
                var types = ['Array', 'String', 'Number', 'Date', 'Object', 'Nodeelement','Nodelist','Htmlcollection','Node'];
                each(types, function () {
                    var v = this.v;
                    This['is' + v] = function (el) { return is(el, v) }
                    TF['is' + v] = function () { return is(this, v) }
                });

                //PR.objects([Number]);
                setProto('TYPE', TF); PR.objects('*');
            }
            $SET('TYPE', new TYPE());

            // Service OTHER
            function OTHER() {
                var This = this, OF = {}, OT = $GET('PROTO');

                This.each = function (el, f, args, strIndex) { return each(el, f, args, strIndex) } ;
                OF.each = function (f, args, strIndex) { return each(this, f, args, strIndex) } ;
                //Object.prototype.each = OF.each;

                This.keys = function (obj, filter) { return keys(obj||This, filter) } ;
                OF.keys = function (filter) { return keys(this, filter) } ;
                //Object.prototype.keys = OF.keys;

                This.repeat = function (el, nb, f, args) { return repeat(el, nb, f, args) } ;
                OF.repeat = function (nb, f, args) { return repeat(this, nb, f, args) } ;
                String.prototype.repeat = OF.repeat;
                //Object.prototype.repeat = OF.repeat;

                This.trim = function (str, reg, isIgnore) { return trim(str, reg, isIgnore) } ;
                OF.trim = function (reg, isIgnore) { return trim(this, reg, isIgnore) } ;
                String.prototype.trim = OF.trim;

                //OT.objects([Number]);
                setProto('OTHER', OF);
                OT.objects('*')
            }
            $SET('OTHER', new OTHER());


            /**** Dans les services, il y a quelques problèmes avec les RegExp ***/
        // ---------------------------------------------------------------
            // Service GET
            function GET() {
                var This = this, C = $GET('CONFIG'), GF = {};
                function setGets(ob, name) {
                    var name2 = name.toLowerCase();
                    This[name2] = function (el, nb, other) {
                        var t = is(el);
                        return ob['hasOwnProperty'](t) ? ob[t](el, nb, other) : el
                    }
                    GF['get' + name] = function (nb, other) {
                        return This[name2](this, nb, other)
                    };
                }

                var middle = {
                        string: function (el) {
                            var l = el.length, n = parseInt(l / 2);
                            return (l % 2) ? el.slice(n, n + 1) : el.slice(n - 1, n + 1)
                        },
                        array: function (el) { return middle.string(el) },
                        // Renvoie le service NODE
                        node: function (el, zkId) {
                            var res = [];
                            el = (zkId === ZKID) ? el : (el.get());
                            each(el, function () {
                                res = res.concat(middle.array(toArray(this.v.children)))
                            });
                            return $GET('NODE').$(res)
                        },
                        // Renvoie le service NODE
                        nodeelement: function (el) { return middle.node([el], ZKID) },
                        // Renvoie le service NODE
                        nodelist: function (el) { return middle.node(toArray(el), ZKID) },
                        // Renvoie le service NODE
                        htmlcollection: function (el) { return middle.nodelist(el) }
                    },
                    first = {
                        string: function (el, reg, last) {
                            if(reg===undefined){reg=1}
                            if (is(reg, 'number')) {
                                reg = Math.abs(reg);
                                return last ? el.slice(-reg) : el.slice(0, reg)
                            } else {
                                if (reg === '') { return '' }
                                if (!is(reg, 'regexp')) { reg = new RegExp('\\b' + reg + '\\b', C.flags()) }
                                var r = el.match(reg);
                                return r ? r[last ? r.length - 1 : 0] : '';
                            }
                        },
                        array: function (el, reg, last) {
                            if(reg===undefined){reg=1}
                            if (is(reg, 'number')) {
                                reg = Math.abs(reg);
                                return last ? el.slice(-reg) : el.slice(0, reg)
                            } else {
                                var i, k = el.length, v;
                                if (reg === '') { return '' }
                                if (!is(reg, 'regexp')) {
                                    reg = new RegExp('^' + reg + '$', C.flags())
                                }
                                if (last) {
                                    for (i = k - 1; i > -1; i--) {
                                        v = el[i];
                                        if (reg.test(v)) {
                                            return [el[i]]
                                        }
                                    }
                                } else {
                                    for (i = 0; i < k; i++) {
                                        v = el[i];
                                        if (reg.test(v)) {
                                            return [v]
                                        }
                                    }
                                }
                                return [];
                            }
                        },
                        // Renvoie le service NODE
                        node: function (el, reg, last, zkId) {
                            var res = [];
                            if (reg === undefined) { reg = 1 }
                            el = (zkId === ZKID) ? el : (el.get());
                            each(el, function () {
                                if (is(reg, 'number')) {
                                    res = res.concat(first.array(toArray(this.v.children), reg, last))
                                } else {
                                    var firstLast = querySelectorAll(this.v, reg);
                                    if (firstLast) {
                                        res = res.concat(first.array(toArray(firstLast), 1, last))
                                    }
                                }
                            });
                            return $GET('NODE').$(res)
                        },
                        // Renvoie le service NODE
                        nodeelement: function (el, reg, last) { return first.node([el], reg, last, ZKID) },
                        // Renvoie le service NODE
                        nodelist: function (el, reg, last) { return first.node(toArray(el), reg, last, ZKID) },
                        // Renvoie le service NODE
                        htmlcollection: function (el, reg, last) { return first.nodelist(el, reg, last) }
                    },
                    last = {
                        string: function (el, reg) { return first.string(el, reg, 1) },
                        array: function (el, reg) { return first.array(el, reg, 1) },
                        // Renvoie le service NODE
                        node: function (el, reg) { return first.node(el, reg, 1) },
                        nodeelement: function (el, reg) { return first.nodeelement(el, reg, 1) },
                        nodelist: function (el, reg) { return first.nodelist(el, reg, 1) },
                        htmlcollection: function (el, reg) { return first.htmlcollection(el, reg, 1) },
                    },
                    both = {
                        string: function (el, reg) {
                            var r = This.first(el, reg);
                            return r.concat(This.last(el, reg))
                        },
                        array: function (el, reg) {
                            return both.string(el, reg)
                        },
                        // Renvoie le service NODE
                        node: function (el, reg, type) {
                            if (!both.hasOwnProperty(type)) {
                                type = 'node'
                            }
                            var f = first[type](el, reg), l = last[type](el, reg);
                            return $GET('NODE').$(f.get().concat(l.get()))
                        },
                        // Renvoie le service NODE
                        nodeelement: function (el, reg) {
                            return both.node(el, reg, 'nodeelement')
                        },
                        // Renvoie le service NODE
                        nodelist: function (el, reg) {
                            return both.node(el, reg, 'nodelist')
                        },
                        // Renvoie le service NODE
                        htmlcollection: function (el, reg) {
                            return both.node(el, reg, 'htmlcollection')
                        }
                    },
                    before = {
                        string: function (el, reg, after) {
                            if (is(reg, 'number')) {
                                reg = Math.abs(reg);
                                return after ? el.slice(reg + 1) : el.slice(0, reg)
                            }
                            if (reg === '') { return '' }
                            if (!is(reg, 'regexp')) { reg = new RegExp('\\b' + reg + '\\b', C.flags()) }
                            reg = el.match(reg);
                            if (!reg) { return '' }
                            reg = reg[0];
                            var i = el.search(reg);
                            if (after) { i += reg.length - 1 }
                            return before.string(el, i, after)
                        },
                        array: function (el, reg, after) {
                            if (is(reg, 'number')) {
                                reg = Math.abs(reg);
                                return before.string(el, reg, after)
                            }
                            if (reg === '') { return [] }
                            if (!is(reg, 'regexp')) { reg = new RegExp('^' + reg + '$', C.flags()) }
                            var i, k = el.length, v;
                            for (i = 0; i < k; i++) {
                                v = el[i];
                                if (reg.test(v)) { return before.string(el, i, after) }
                            }
                            return []
                        },
                        // Retourne le service NODE
                        node: function (el, reg, after, zkId) {
                            var res = [];
                            el = (zkId === ZKID) ? el : (el.get());
                            each(el, function () {
                                var children = toArray(this.v.children);
                                if (is(reg, 'number')) {
                                    res = res.concat(before.array(children, reg, after))
                                } else {
                                    var beforeAfterNode = is(reg, 'nodeelement') ? reg : querySelector(this.v, reg), i, k = children.length;
                                    for (i = 0; i < k; i++) {
                                        if (children[i] === beforeAfterNode) {
                                            res = res.concat(after ? children.slice(i + 1) : children.slice(0, i));
                                            i = k + 1
                                        }
                                    }
                                }
                            });
                            return $GET('NODE').$(res)
                        },
                        // Retourne le service NODE
                        nodeelement: function (el, reg, after) { return before.node([el], reg, after, ZKID) },
                        // Retourne le service NODE
                        nodelist: function (el, reg, after) { return before.node(toArray(el), reg, after, ZKID) },
                        // Retourne le service NODE
                        htmlcollection: function (el, reg, after) { return before.nodelist(el, reg, after) }
                    },
                    after = {
                        string: function (el, reg) { return before.string(el, reg, 1) },
                        array: function (el, reg) { return before.array(el, reg, 1) },
                        // Renvoie le service NODE
                        node: function (el, reg) { return before.node(el, reg, 1) },
                        nodeelement: function (el, reg) { return before.nodeelement(el, reg, 1) },
                        nodelist: function (el, reg) { return before.nodelist(el, reg, 1) },
                        htmlcollection: function (el, reg) { return before.htmlcollection(el, reg, 1) },
                    },
                // Tableau paire obligatoirement
                    between = {
                        string: function (el, tab) {
                            var i, t, k, res = is(el, 'array') ? [] : '';
                            if (!is(tab, 'array')) { return res }
                            k = tab.length;
                            for (i = 0; i < k; i += 2) {
                                t = [Math.abs(tab[i]), Math.abs(tab[i + 1])];
                                if(isNaN(t[1])){ t[1] = el.length }
                                if (is(t[0], 'number') && is(t[1], 'number')) {
                                    t = nSort(t);
                                    res = res.concat(el.slice(t[0] + 1, t[1]))
                                }
                            }
                            return res
                        },
                        array: function (el, tab) { return between.string(el, tab) },
                        // Renvoie le service NODE
                        node: function (el, tab, zkId) {
                            var res = [];
                            el = (zkId === ZKID) ? el : (el.get());
                            each(el, function () {
                                res = res.concat(between.array(toArray(this.v.children), tab))
                            });
                            return $GET('NODE').$(res)
                        },
                        // Renvoie le service NODE
                        nodeelement: function (el, tab) { return between.node([el], tab, ZKID) },
                        // Renvoie le service NODE
                        nodelist: function (el, tab) { return between.node(toArray(el), tab, ZKID) },
                        // Renvoie le service NODE
                        htmlcollection: function (el, tab) { return between.nodelist(el, tab) }
                    },
                    at = {
                        string: function (el, tab) {
                            var n, k = el.length, res = is(el, 'array') ? [] : '';
                            if (!is(tab, 'array')) { tab = [tab] }
                            each(tab, function () {
                                n = Math.abs(this.v);
                                if (is(n, 'number')) {
                                    if (n < k) {
                                        res = res.concat(el[n])
                                    }
                                }
                            });
                            return res
                        },
                        array: function (el, tab) { return at.string(el, tab) },
                        // Renvoie le service NODE
                        node: function (el, tab, zkId) {
                            var res = [];
                            el = (zkId === ZKID) ? el : (el.get());
                            each(el, function () {
                                res = res.concat(at.array(toArray(this.v.children), tab))
                            });
                            return $GET('NODE').$(res)
                        },
                        // Renvoie le service NODE
                        nodeelement: function (el, tab) { return at.node([el], tab, ZKID) },
                        // Renvoie le service NODE
                        nodelist: function (el, tab) { return at.node(toArray(el), tab, ZKID) },
                        // Renvoie le service NODE
                        htmlcollection: function (el, tab) { return at.nodelist(el, tab) }
                    },
                    /**
                     * Recherche par RegExp ou par String
                     *  NOTES :
                     *      - Pour les drapaux, utilisez le service CONFIG pour les String
                     *      - nodeelement, nodelist, htmlcollection, on peut indiquer le nom de l'élément en minuscule
                     *      - On ne peut obtenir de noeud text
                     *      - Pour les node et autres, il faut utiliser un sélecteur css : "span[class^=sp]" par exmeple
                     * @type {{string: Function, array: Function, nodeelement: Function, nodelist: Function, htmlcollection: Function}}
                     */
                    all = {
                        string: function (el, reg) {
                            if (!is(reg, 'regexp')) { reg = new RegExp('' + reg, 'g' + (C.flags())) }
                            var res = el.match(reg);
                            if (!res) { res = [] }
                            res = res.join('')
                            return res
                        },
                        array: function (el, reg) {
                            var res = [];
                            if (!is(reg, 'regexp')) { reg = new RegExp('^' + reg + '$', C.flags()) }
                            each(el, function () {
                                var v = this.v;
                                if (reg.test(v)) { res.push(this.v) }
                            });
                            return res
                        },
                        // Renvoie le service NODE
                        node: function (el, cssSel, zkId) {
                            var res = [];
                            el = (zkId === ZKID) ? el : (el.get());
                            each(el, function () {
                                res = res.concat(toArray(querySelectorAll(this.v, cssSel)))
                            });
                            return $GET('NODE').$(res)
                        },
                        // Renvoie le service NODE
                        nodeelement: function (el, cssSel) { return all.node([el], cssSel, ZKID) },
                        // Renvoie le service NODE
                        nodelist: function (el, cssSel) { return all.node(toArray(el), cssSel, ZKID) },
                        // Renvoie le service NODE
                        htmlcollection: function (el, cssSel) { return all.nodelist(el, cssSel) }
                    },
                // Renvoie un attribut ou une chaîne vide
                    attr = {
                        // Renvoie un String
                        node: function (el, att, zkId) {
                            var nodes = (zkId === ZKID) ? el : el.get();
                            if (!nodes.length) { return '' }
                            var val = nodes[0].getAttribute('' + att);
                            return val ? val : ''
                        },
                        nodeelement: function (el, att) { return attr.node([el], att, ZKID) },
                        nodelist: function (el, att) { return attr.node(toArray(el), att, ZKID) },
                        htmlcollection: function (el, att) { return attr.node(toArray(el), att, ZKID) },
                    },
                    attrs = ['Class', 'Id'];
                each(attrs, function () {
                    var name = this.v.toLowerCase();
                    This[name] = function (el) {
                        return This.attr(el, name)
                    }
                    GF['get' + this.v] = function () {
                        return This[name](this)
                    }
                });

                /**
                 * Cette permet d'obtenir les coordonnées d'un élément dans tout le document
                 * @param node
                 * @param what = offsetLeft ou offsetTop
                 * @returns {number}
                 */
                function nodeXYintoDocument(node, what) {
                    var val = 0;
                    do {
                        val += node[what];
                    } while (node = node.offsetParent);
                    return val
                }
                var doCssForGet = {
                    margin: function (node, edge, css) {
                        edge = edge || cssEdge;
                        css = css || 'margin-';
                        var ob = {};
                        each(edge, function () {
                            var v = this.v.toLowerCase();
                            // node.currentStyle[css+this.v]    pour IE<9
                            ob[v] = Number(getComputedStyle(node, null)[css + v].replace(/[^0-9\.-]/g, ''));
                        });
                        if (edge.length === 1) {
                            ob = ob[edge[0]]
                        }
                        return ob
                    },
                    padding: function (node, edge) { return doCssForGet.margin(node, edge, 'padding-') },
                    border: function (node) {
                        var edge = ['top', 'right', 'bottom', 'left'], what = ['width', 'style', 'color'], res = [];
                        each(edge, function () {
                            var e = this.v, s = '';
                            each(what, function () {
                                s += ' ' + getComputedStyle(node, null)['border-' + e + '-' + this.v]
                            });
                            res[this.i] = s.slice(1);
                        });
                        if (res.length > 1) {
                            res = {top: res[0], right: res[1], bottom: res[2], left: res[3]}
                        }
                        return res
                    },
                    borderWidth: function (node) {
                        var edge = ['top', 'right', 'bottom', 'left'];
                        each(edge, function () {
                            return Number(getComputedStyle(node, null)['border-' + this.v + '-width'].replace(/[^0-9\.-]/g, ''))
                        });
                        if (edge.length > 1) {
                            edge = {top: edge[0], right: edge[1], bottom: edge[2], left: edge[3]}
                        }
                        return edge
                    },
                    'border-width': function (node) { return doCssForGet.borderWidth(node) },
                    borderStyle: function (node, what) {
                        var edge = ['top', 'right', 'bottom', 'left'];
                        each(edge, function () {
                            return getComputedStyle(node, null)['border-' + (this.v) + '-' + (what || 'style')]
                        });
                        if (edge.length > 1) {
                            edge = {top: edge[0], right: edge[1], bottom: edge[2], left: edge[3]}
                        }
                        return edge;
                    },
                    'border-style': function (node) { return doCssForGet.borderStyle(node) },
                    borderColor: function (node) { return doCssForGet.borderStyle(node, 'color') },
                    'border-color': function (node) { return doCssForGet.borderColor(node) },
                    width: function (node, height) { return Number(getComputedStyle(node, null)[height || 'width'].replace(/[^0-9\.-]/g, '')) },
                    // width + padding
                    width1: function (node, h) {
                        var w = doCssForGet[h ? 'height' : 'width'](node), p = doCssForGet.padding(node);
                        return p[h ? 'top' : 'left'] + w + p[h ? 'bottom' : 'right']
                    },
                    // width + padding + border
                    width2: function (node, h) {
                        var w = doCssForGet.width1(node, h), m = doCssForGet.borderWidth(node);
                        return m[h ? 'top' : 'left'] + w + m[h ? 'bottom' : 'right']
                    },
                    height: function (node) { return doCssForGet.width(node, 'height') },
                    // height + padding
                    height1: function (node) { return doCssForGet.width1(node, 1) },
                    // height + padding + border
                    height2: function (node) { return doCssForGet.width2(node, 1) },
                    // Position à gauche de l'élément par rapport au document entier
                    x: function (node) { return nodeXYintoDocument(node, 'offsetLeft') },
                    // Position à gauche de l'élément par rapport à son parent
                    innerX: function (node) { return node.offsetLeft },
                    // Position en haut de l'élément par rapport au document entier
                    y: function (node) { return nodeXYintoDocument(node, 'offsetTop') },
                    // Position en haut de l'élément par rapport à son parent
                    innerY: function (node) { return node.offsetTop }
                };
                var cssEdge = ['Top', 'Right', 'Bottom', 'Left'], cssProprities = ['margin', 'padding'];
                each(cssProprities, function () {
                    var prop = this.v;
                    each(cssEdge, function () {
                        var edge = this.v.toLowerCase();
                        doCssForGet[prop + '-' + edge] = function (node) {
                            return doCssForGet[prop](node, [edge])
                        };
                        doCssForGet[prop + this.v] = function (node) {
                            return doCssForGet[prop](node, [edge])
                        };
                    });
                });
                /**
                 * A la base de tous les styles. Pour un résultat multiple, on obtient un tableau. Les valeurs obtenues sont en px
                 *      Par exemple avec margin, on obtient {top: 12, left: 30, bottom: 3, right: 10}
                 * @type {{node: Function}}
                 */
                var style = {
                    node: function (el, nb, zkId) {
                        var node = ((zkId === ZKID) ? el : el.get())[0], val = undefined;
                        if (node) {
                            if (doCssForGet.hasOwnProperty(nb)) {
                                val = doCssForGet[nb](node)
                            } else {
                                val = getComputedStyle(node, null)[nb]
                            }
                        }
                        return val
                    },
                    nodeelement: function (el, nb) { return style.node([el], nb, ZKID) },
                    nodelist: function (el, nb) { return style.node(toArray(el), nb, ZKID) },
                    htmlcollection: function (el, nb) { return style.nodelist(el, nb) }
                };
                cssProprities = ['color','margin', 'padding', 'border', 'width', 'width1', 'width2', 'height', 'height1', 'height2', 'x', 'innerX', 'y', 'innerY','background','cursor','position'] ;
                each(cssProprities, function () {
                    var v = this.v, prop = v[0].toUpperCase() + (v.slice(1));
                    This[v] = function (el) {
                        return This.style(el, v)
                    };
                    GF['get' + prop] = function () {
                        return This[v](this)
                    };
                });
                var parent = {
                    node: function (el, zkId) {
                        var nodes = ((zkId === ZKID) ? el : el.get()), res = [];
                        each(nodes, function () {
                            res.push(this.v.parentNode)
                        });
                        return $GET('NODE').$(res)
                    },
                    nodeelement: function (el) { return parent.node([el], ZKID) },
                    nodelist: function (el) { return parent.node(toArray(el), ZKID) },
                    htmlcollection: function (el) { return parent.nodelist(el) }
                };
                /**
                 * Permet d'obtenir les noeudds enfants
                 *      - nb === undefined    => Renvoie tous les noeuds enfants de chaque élément
                 *      - is(nb,'array')    => On utilise la fonction This.at
                 *      - is(nb,'number')    => On utilise la fonction This.first
                 *      - isAll === true    => Renvoie tous les noeuds enfants y compris les textes et les commentaires
                 * @type {{node: Function, nodeelement: Function, nodelist: Function, htmlcollection: Function}}
                 */
                // Traiter le cas des String
                var children = {
                    node: function (el, zkId) {
                        var nodes = ((zkId === ZKID) ? el : el.get()), res = [];
                        each(nodes, function () {
                            res = res.concat(toArray(this.v.children));
                        });
                        return $GET('NODE').$(res)
                    },
                    nodeelement: function (el) { return children.node([el], ZKID) },
                    nodelist: function (el) { return children.node(toArray(el), ZKID) },
                    htmlcollection: function (el) { return children.nodelist(el) }

                };
                var doByTagNameForText = {
                    input: function (node) { return node.value },
                    textarea: function (node) { return node.value },
                    select: function(node){ return node.options[node.selectedIndex].value }
                };
                var text = {
                    node: function (el, html, zkId) {
                        var node = ((zkId === ZKID) ? el : el.get())[0], res = '', name;
                        if (node) {
                            name = node.nodeName.toLowerCase();
                            if (doByTagNameForText.hasOwnProperty(name)) {
                                res = doByTagNameForText[name](node)
                            } else {
                                res = node[(html === ZKID) ? 'innerHTML' : 'textContent']
                            }
                        }
                        return res
                    },
                    nodeelement: function (el, html) { return text.node([el], html, ZKID) },
                    nodelist: function (el, html) { return text.node(toArray(el), html, ZKID) },
                    htmlcollection: function (el, html) { return text.nodelist(el, html) }
                };
                This.value = function(el){ return This.text(el) };
                GF.getValue = function(){ return This.value(this) };
                var html = {
                    node: function (el) { return text.node(el, ZKID) },
                    nodeelement: function (el) { return text.nodeelement(el, ZKID) },
                    nodelist: function (el) { return text.nodelist(el, ZKID) },
                    htmlcollection: function (el) { return html.nodelist(el) }
                };
                // Renvoie le service NODE
                var checked = {
                    node: function (el, zkId) {
                        var nodes = ((zkId === ZKID) ? el : el.get()), res = [], v, type;
                        each(nodes, function () {
                            v = this.v;
                            if (v.nodeName.toLowerCase() === 'input') {
                                type = v.getAttribute('type');
                                if ((type === 'radio' || type === 'checkbox') && v.checked) {
                                    res = res.concat(v)
                                }
                            }
                        });
                        return $GET('NODE').$(res)
                    },
                    nodeelement: function (el) { return checked.node([el], ZKID) },
                    nodelist: function (el) { return checked.node(toArray(el), ZKID) },
                    htmlcollection: function (el) { return checked.nodelist(el) }
                };
                // Renvoie le service NODE
                var selected = {
                    node: function (el, zkId) {
                        var nodes = ((zkId === ZKID) ? el : el.get()), res = [], v, name, options;
                        each(nodes, function () {
                            v = this.v;
                            name = v.nodeName.toLowerCase();
                            if (name === 'option') {
                                options = [v]
                            }
                            if (name === 'select') {
                                options = toArray(querySelectorAll(v, 'option'))
                            }
                            each(options, function () {
                                if (this.v.selected) {
                                    res = res.concat(this.v)
                                }
                            });
                        });
                        return $GET('NODE').$(res)
                    },
                    nodeelement: function (el) { return selected.node([el], ZKID) },
                    nodelist: function (el) { return selected.node(toArray(el), ZKID) },
                    htmlcollection: function (el) { return selected.nodelist(el) }
                };
                var forSetGets = {
                    Middle: middle,
                    First: first,
                    Last: last,
                    Both: both,
                    Before: before,
                    After: after,
                    Between: between,
                    At: at,
                    All: all, /*Index: index,*/
                    Attr: attr,
                    Css: style,
                    Style: style,
                    Parent: parent,
                    Children: children,
                    Text: text,
                    Html: html,
                    Checked: checked,
                    Selected: selected
                };
                each(forSetGets, function () { setGets(this.v, this.k) });
                var getByEmptyOpt = {
                    node: function (el) { return el.get() },
                    // Renvoie le service NODE
                    nodeelement: function (el) { return [el] },
                    // Renvoie le service NODE
                    nodelist: function (el) { return toArray(el) },
                    // Renvoie le service NODE
                    htmlcollection: function (el) { return toArray(el) }
                };
                This.get = function (el, reg) {
                    var t = is(reg);
                    if (t === 'string') { return This.all(el, reg) }
                    if (t === 'array' || t === 'number') { return This.at(el, reg) }
                    t = is(el);
                    return (getByEmptyOpt.hasOwnProperty(t)) ? getByEmptyOpt[t](el) : el
                };
                GF.get = function (reg) { return This.get(this, reg) };
                setProto('GET', GF);
            }
            $SET('GET', new GET());

            // Service REMOVE
            function REMOVE() {
                var This = this, C = $GET('CONFIG'), G = $GET('GET'), RF = {};
                var defaultsValues = {
                    first: 1,
                    last: 1,
                    both: 1,
                    between: [0, 0]
                };
                var removeAllElements = {
                    string: function () {
                        return ''
                    },
                    array: function () {
                        return []
                    },
                    // Renvoie le service NODE
                    node: function (el, zkId) {
                        var nodes = (zkId === ZKID) ? el : el.get();
                        each(nodes, function () {
                            this.v.innerHTML = ''
                        });
                        return $GET('NODE').$(nodes)
                    },
                    nodeelement: function (el) {
                        return removeAllElements.node([el], ZKID)
                    },
                    nodelist: function (el) {
                        return removeAllElements.node(toArray(el), ZKID)
                    },
                    htmlcollection: function (el) {
                        return removeAllElements.node(toArray(el), ZKID)
                    },
                };
                function removeNode(el, reg, other, opt) {
                    if (opt === 'all' && reg === undefined) {
                        var t = is(el);
                        return removeAllElements.hasOwnProperty(t) ? removeAllElements[t](el) : el
                    }
                    var rm = $GET('GET')[opt](el, reg, other), t = is(el);
                    each(rm, function () {
                        this.v.parentNode.removeChild(this.v)
                    });
                    if (t !== 'node') {
                        el = $GET('NODE').$((t === 'nodeelement') ? [el] : toArray(el))
                    }
                    return el
                }
                /**
                 * Elle supprime les éléments dupliqués d'un tableau. Il faut que le tableau soit trié.
                 * @param tab
                 * @returns {Array}
                 */
                function onceInArray(tab) {
                    var res = [], r;
                    each(tab, function () {
                        var v = this.v;
                        if (r !== v) {
                            res.push(v);
                            r = v
                        }
                    });
                    return res
                }

                var middle = {
                    string: function (el) {
                        var l = el.length, x = (l % 2) ? 1 : 2, n = parseInt(l / 2);
                        return doSlice(el, (x == 2) ? n - 1 : n, n + x - (x - 1))
                    },
                    array: function (el) { return middle.string(el) },
                    // Renvoie le service NODE
                    node: function (el, zkId) {
                        var res = [];
                        el = (zkId === ZKID) ? el : (el.get());
                        var middle = G.middle(This).get();
                        each(el, function () {
                            res = res.concat(middle.array(toArray(this.v.children)))
                        });
                        return $GET('NODE').$(res)
                    },
                    // Renvoie le service NODE
                    nodeelement: function (el) { return middle.node([el], ZKID) },
                    // Renvoie le service NODE
                    nodelist: function (el) { return middle.node(toArray(el), ZKID) },
                    // Renvoie le service NODE
                    htmlcollection: function (el) { return middle.nodelist(el) }
                };
                // removeFirst('div.rouge'); est possible
                var first = {
                    string: function (el, reg, last) {
                        if (is(reg, 'number')) {
                            reg = Math.abs(reg);
                            return last ? el.slice(0, -reg) : el.slice(reg)
                        }
                        if (reg === '') {
                            return el
                        }
                        if (!is(reg, 'regexp')) {
                            reg = new RegExp('\\b' + reg + '\\b', C.flags())
                        }
                        var i, r;
                        if (last) {
                            r = el.match(reg);
                            if (!r) return el;
                            reg = r[r.length - 1];
                            i = el.lastIndexOf(reg);
                            return doSlice(el, i, i + reg.length);
                        } else {
                            return el.replace(reg, '')
                        }
                    },
                    array: function (el, nb, last) {
                        if (is(nb, 'number')) {
                            nb = Math.abs(nb);
                            return first.string(el, nb, last)
                        }
                        if (nb === '') {
                            return el
                        }
                        var i, k = el.length, reg = nb;
                        if (!is(reg, 'regexp')) {
                            reg = new RegExp('\\b' + reg + '\\b', C.flags())
                        }
                        if (last) {
                            for (i = k - 1; i > -1; i--) {
                                if (reg.test(el[i])) {
                                    el.splice(i, 1);
                                    return el
                                }
                            }
                        } else {
                            for (i = 0; i < k; i++) {
                                if (reg.test(el[i])) {
                                    el.splice(i, 1);
                                    return el
                                }
                            }
                        }
                        return el;
                    },
                };
                var last = {
                    string: function (el, nb) {
                        return first.string(el, nb, 1)
                    },
                    array: function (el, nb) {
                        return first.array(el, nb, 1)
                    },
                };
                var both = {
                    string: function (el, nb) {
                        return last.string(first.string(el, nb), nb)
                    },
                    array: function (el, nb) {
                        return last.array(first.array(el, nb), nb)
                    },
                };
                // removeBefore('^div$'); par exemple
                var before = {
                    string: function (el, nb, after) {
                        if (is(nb, 'number')) {
                            nb = Math.abs(nb);
                            return after ? (el.slice(0, nb + 1)) : (el.slice(nb))
                        }
                        if (nb === '') {
                            return el
                        }
                        if (!is(nb, 'regexp')) {
                            nb = new RegExp('\\b' + nb + '\\b', C.flags())
                        }
                        nb = el.match(nb);
                        if (!nb) {
                            return el
                        }
                        nb = nb[0];
                        var i = el.search(nb);
                        if (after) {
                            i += nb.length - 1
                        }
                        return before.string(el, i, after);
                    },
                    array: function (el, nb, after) {
                        if (is(nb, 'number')) {
                            return before.string(el, nb, after)
                        }
                        if (nb === '') {
                            return el
                        }
                        var i, k = el.length, reg = nb, v;
                        if (!is(nb, 'regexp')) {
                            reg = new RegExp('\\b' + nb + '\\b', C.flags())
                        }
                        for (i = 0; i < k; i++) {
                            if (reg.test(el[i])) {
                                return before.string(el, i, after)
                            }
                        }
                        return el
                    },
                };
                var after = {
                    string: function (el, nb) {
                        return before.string(el, nb, 1)
                    },
                    array: function (el, nb) {
                        return before.array(el, nb, 1)
                    },
                };
                var between = {
                    string: function (el, tab, V) {
                        if (!is(tab, 'array')) {
                            tab = [tab]
                        }
                        if (tab.length % 2) {
                            tab.push(el.length - 1)
                        }
                        tab = nSort(tab);
                        if (is(tab[0], 'number') && is(tab[1], 'number')) {
                            el = doSlice(el, tab[0] + 1, tab[1], V);
                        }
                        return el
                    },
                    array: function (el, tab, V) {
                        return between.string(el, tab, V)
                    },
                };
                // Supprimer les valeurs négatives du tableau
                var at = {
                    string: function (el, tab) {
                        if (!is(tab, 'array')) {
                            tab = [tab]
                        }
                        tab = onceInArray(nSortD(tab));
                        each(tab, function () {
                            var n = this.v;
                            if (is(n, 'number')) {
                                el = el.slice(0, n).concat(el.slice(n + 1))
                            }
                        });
                        return el
                    },
                    array: function (el, tab) {
                        return at.string(el, tab)
                    },
                };
                /**
                 * Recherche par RegExp.
                 *  NOTES :
                 *      - Evitez les pseudo class comme \d \w ...
                 *      - Pour les drapeux, utilisez le service CONFIG
                 *      - nodeelement, nodelist, htmlcollection, on peut indiquer le nom de l'élément en minuscule
                 *      - On ne peut obtenir de noeud text
                 * @type {{string: Function, array: Function, nodeelement: Function, nodelist: Function, htmlcollection: Function}}
                 */
                var all = {
                    string: function (el, reg) {
                        if (!is(reg, 'regexp')) {
                            reg = new RegExp('\\b' + reg + '\\b', C.flags())
                        }
                        return el.replace(reg, '')
                    },
                    array: function (el, reg) {
                        var i, k = el.length, res = [], v;
                        if (!is(reg, 'regexp')) {
                            reg = new RegExp('\\b' + reg + '\\b', C.flags())
                        }
                        for (i = 0; i < k; i++) {
                            v = el[i];
                            if (!reg.test(v)) {
                                res.push(v)
                            }
                        }
                        return res
                    },
                };
                var opts = {
                    middle: middle,
                    first: first,
                    last: last,
                    both: both,
                    before: before,
                    after: after,
                    between: between,
                    at: at,
                    all: all
                };
                // Renvoie le service NODE
                var els = ['node', 'nodeelement', 'nodelist', 'htmlcollection'];
                each(opts, function () {
                    var opt = this.v, name = this.i;
                    each(els, function () {
                        opt[this.v] = function (el, reg) {
                            return removeNode(el, reg, 0, name)
                        }
                    });
                });
                // On peut spécifier plusieurs valeurs en les séparant par des espaces ou des virgules
                var attr = {
                        // Renvoie le service NODE
                        node: function (el, atts, attrVal, zkId) {
                            var nodes = (zkId === ZKID) ? el : el.get(), v, val, att;
                            if (attrVal !== undefined) {
                                attrVal = ' ' + trim(attrVal + '') + ' '
                            }
                            atts = trim(atts + '', ' ,').split(/[ ,]/);
                            each(atts, function () {
                                att = this.v;
                                each(nodes, function () {
                                    v = this.v;
                                    val = v.getAttribute(att);
                                    if (val) {
                                        if (attrVal) {
                                            val = trim((' ' + val + ' ').replace(attrVal, ' '));
                                            if (val) {
                                                v.setAttribute(att, val)
                                            } else {
                                                v.removeAttribute(att)
                                            }
                                        } else {
                                            v.removeAttribute(att)
                                        }
                                    }
                                });
                            });
                            return $GET('NODE').$(nodes)
                        },
                        nodeelement: function (el, att, attrVal) {
                            return attr.node([el], att, attrVal, ZKID)
                        },
                        nodelist: function (el, att, attrVal) {
                            return attr.node(toArray(el), att, attrVal, ZKID)
                        },
                        htmlcollection: function (el, att, attrVal) {
                            return attr.node(toArray(el), att, attrVal, ZKID)
                        },
                    },
                    attrs = ['Class', 'Id'] ;
                each(attrs, function () {
                    var name = this.v.toLowerCase();
                    This[name] = function (el, nb) {
                        return This.attr(el, name, nb)
                    }
                    RF['remove' + this.v] = function (nb) {
                        return This.attr(this, name, nb)
                    }
                }) ;
                // On peut spécifier plusieurs valeurs en les séparant par des espaces ou des virgules
                var Style = {
                    // Renvoie le service NODE
                    node: function (el, styles, zkId) {
                        var nodes = (zkId === ZKID) ? el : el.get();
                        el = $GET('NODE').$(nodes) ;
                        if(styles === undefined){ return This.attr(el, 'style') }
                        styles = trim(styles + '', ' ,').split(/[ ,]/);
                        each(styles, function () {
                            var style = this.v, v, val, reg = new RegExp(';' + style + '[^;]*;', 'gi');
                            each(nodes, function () {
                                v = this.v;
                                if (style === undefined) { This.attr(v, 'style') }
                                else {
                                    val = trim(v.getAttribute('style'), ' ;');
                                    if (val) {
                                        val = trim((';' + val + ';').replace(reg, ';'), ' ;');
                                        if (val) {
                                            //var newAttr = document.createAttribute('style');
                                            //newAttr.value = val ;
                                            v.setAttribute('style', val);
                                        } else {
                                            v.removeAttribute('style')
                                        }
                                    }
                                }
                            });
                        });
                        return el
                    },
                    nodeelement: function (el, style) { return Style.node([el], style, ZKID) },
                    nodelist: function (el, style) { return Style.node(toArray(el), style, ZKID) },
                    htmlcollection: function (el, style) { return Style.node(toArray(el), style, ZKID) },
                } ;
                var styles = ['Color','Margin','Padding','Border','Width','Height'] ;
                each(styles, function () {
                    var style = this.v.toLowerCase();
                    This[style] = function (el) { return This.style(el, style) }
                    RF['remove' + this.v] = function() { return This.style(this, style) }
                }) ;
                // Recherche par RegExp ou par String
                var text = {
                    // Renvoie le service NODE
                    node: function (el, reg, zkId) {
                        var nodes = (zkId === ZKID) ? el : el.get();
                        if(reg === undefined){ reg = /.+/g }
                        each(nodes, function () {
                            clearChangeIntoNode(this.v, reg)
                        });
                        return $GET('NODE').$(nodes)
                    },
                    nodeelement: function (el, reg) { return text.node([el], reg, ZKID) },
                    nodelist: function (el, reg) { return text.node(toArray(el), reg, ZKID) },
                    htmlcollection: function (el, reg) { return text.nodelist(el, reg) },
                } ;
                // Recherche par String uniquement
                var tag = {
                    // Renvoie le service NODE
                    node: function (el, name, zkId) {
                        var nodes = (zkId === ZKID) ? el : el.get();
                        el = $GET('NODE').$(nodes) ;
                        if(name === undefined){ return el }
                        each(nodes, function () {
                            clearChangeNodeName(this.v, name)
                        }) ;
                        return el
                    },
                    nodeelement: function (el, name) { return tag.node([el], name, ZKID) },
                    nodelist: function (el, name) { return tag.node(toArray(el), name, ZKID) },
                    htmlcollection: function (el, name) { return tag.nodelist(el, name) },
                } ;
                function setRemoves(ob, name) {
                    var name2 = name.toLowerCase();
                    This[name2] = function (el, nb, other) {
                        var t = is(el);
                        if (nb === undefined && defaultsValues.hasOwnProperty(name2)) {
                            nb = defaultsValues[name2]
                        }
                        return ob['hasOwnProperty'](t) ? ob[t](el, nb, other) : el
                    }
                    RF['remove' + name] = function (nb, other) {
                        return This[name2](this, nb, other)
                    };
                }
                var forSetRemoves = {
                    Middle: middle, First: first, Last: last, Both: both, Before: before, After: after, Between: between, At: at, All: all,
                    Attr: attr, /*Css: Style,*/ Style: Style, /*Children: children,*/ Text: text, Tag: tag,
                };
                each(forSetRemoves, function () { setRemoves(this.v, this.k) });
                var removeByEmptyOpt = {
                    string: function () { return '' },
                    array: function () { return [] },
                    node: function (el, zkId) {
                        var nodes = (zkId === ZKID) ? el : el.get();
                        try {
                            each(nodes, function () { this.v.parentNode.removeChild(this.v) });
                        } finally {
                            return $GET('NODE').$([])
                        }
                    },
                    // Renvoie le service NODE
                    nodeelement: function (el) { return removeByEmptyOpt.node([el], ZKID) },
                    // Renvoie le service NODE
                    nodelist: function (el) { return removeByEmptyOpt.node(toArray(el), ZKID) },
                    // Renvoie le service NODE
                    htmlcollection: function (el) { return removeByEmptyOpt.nodelist(el) }
                };
                This.remove = function (el, reg) {
                    var t = is(reg);
                    if (t === 'string') { return This.all(el, reg) }
                    if (t === 'array' || t === 'number') { return This.at(el, reg) }
                    t = is(el); return (removeByEmptyOpt.hasOwnProperty(t)) ? removeByEmptyOpt[t](el) : el
                };
                RF.remove = function (reg) { return This.remove(this, reg) };

                setProto('REMOVE', RF);
            }
            $SET('REMOVE', new REMOVE());

            // Service ADD
            function ADD() {
                var This = this, C = $GET('CONFIG'), G = $GET('GET'), AF = {};
                // Valeurs possibles
                var addByValueType = {
                    string: function (val) { return $GET('NODE').$(val).get() },
                    array: function (val) {
                        var res = [];
                        each(val, function () {
                            var t = is(this.v);
                            if (addByValueType.hasOwnProperty(t) && t !== 'array') {
                                res = res.concat(addByValueType[t](this.v))
                            }
                        });
                        return res
                    },
                    node: function (val) { return val.get() },
                    nodeelement: function (val) { return [val] },
                    nodelist: function (val) { return toArray(val) },
                    htmlcollection: function (val) { return toArray(val) },
                };
                var middle = {
                    string: function (el, val, zkId) {
                        var l = el.length, n = parseInt(l / 2);
                        if (is(val, 'array') && zkId !== ZKID) { val = val.join(C.sep()) }
                        return doSlice(el, n, n, val);
                    },
                    array: function (el, val) { return middle.string(el, val, ZKID) },
                    // Renvoie le service NODE
                    node: function (el, val, zkId) {
                        var t = is(val), nodes = (zkId === ZKID) ? el : el.get();
                        el = $GET('NODE').$(nodes);
                        if (!addByValueType.hasOwnProperty(t)) { return el }
                        var newNodes = addByValueType[t](val);
                        each(nodes, function () {
                            var parent = this.v,
                                middleNode = G.middle(toArray(parent.children))[0];
                            each(newNodes, function () {
                                var node = this.v.cloneNode(true);
                                if (middleNode) {
                                    insertAfter(node, middleNode);
                                    middleNode = node
                                } else {
                                    parent.appendChild(node);
                                }
                            });
                        });
                        return el
                    },
                    // Renvoie le service NODE
                    nodeelement: function (el, val) { return middle.node([el], val, ZKID) },
                    // Renvoie le service NODE
                    nodelist: function (el, val) { return middle.node(toArray(el), val, ZKID) },
                    // Renvoie le service NODE
                    htmlcollection: function (el, val) { return middle.nodelist(el, val) }
                },
                // Pour les nodes, faire comme last
                first = {
                    string: function (el, val, last) {
                        if (is(val, 'array')) { val = val.join(C.sep()) }
                        val += '' ; return last ? (el + val) : (val + el)
                    },
                    array: function (el, val, last) {
                        if (!is(val, 'array')) { val = [val] }
                        return last ? el.concat(val) : val.concat(el)
                    },
                    // Renvoie le service NODE
                    node: function (el, val, last, zkId) {
                        var nodes = (zkId === ZKID) ? el : el.get();
                        el = $GET('NODE').$(nodes);
                        var t = is(val);
                        if (!addByValueType.hasOwnProperty(t)) { return el }
                        var newNodes = addByValueType[t](val);
                        if (!last) { newNodes.reverse() }
                        each(nodes, function () {
                            var parent = this.v,
                                first = parent.firstElementChild;
                            each(newNodes, function(){
                                if(last || !first){
                                    parent.appendChild(this.v);
                                }else{
                                    insertBefore(this.v, first)
                                }
                            });
                        });
                        return el
                    },
                    // Renvoie le service NODE
                    nodeelement: function (el, val, last) { return first.node([el], val, last, ZKID) },
                    // Renvoie le service NODE
                    nodelist: function (el, val, last) { return first.node(toArray(el), val, last, ZKID) },
                    // Renvoie le service NODE
                    htmlcollection: function (el, val, last) { return first.nodelist(el, val, last) }
                },
                last = {
                    string: function (el, val) { return first.string(el, val, 1) },
                    array: function (el, val) { return first.array(el, val, 1) },
                    // Renvoie le service NODE
                    node: function (el, val) { return first.node(el, val, 1) },
                    nodeelement: function (el, val) { return first.nodeelement(el, val, 1) },
                    nodelist: function (el, val) { return first.nodelist(el, val, 1) },
                    htmlcollection: function (el, val) { return first.htmlcollection(el, val, 1) },
                },
                both = {
                    string: function (el, val) { return last.string(first.string(el, val), val) },
                    array: function (el, val) { return last.array(first.array(el, val), val) },
                    // Renvoie le service NODE
                    /*node: function (el, val) {
                        var t = is(val);
                        if (addByValueType.hasOwnProperty(t)) {
                            var newNodes = addByValueType[t](val);
                            This.first(el, newNodes); This.last(el, newNodes);
                        }
                        return $GET('NODE').$(el);
                    },
                    nodeelement: function (el, val) { return both.node(el, val) },
                    nodelist: function (el, val) { return both.node(el, val) },
                    htmlcollection: function (el, val) { return both.node(el, val) },*/
                },
                before = {
                    string: function (el, reg, val, after) {
                        if (reg === undefined || val === undefined) { return el }
                        if (is(val, 'array')) { val = val.join(C.sep()) }
                        val += '';
                        if (is(reg, 'number')) { reg = Math.abs(reg); return doSlice(el, after ? reg + 1 : reg, after ? reg + 1 : reg, val) }
                        if (reg === '') { return el }
                        if (!is(reg, 'regexp')) { reg = new RegExp('\\b' + reg + '\\b', C.flags()) }
                        reg = el.match(reg);
                        if (!reg) { return el }
                        reg = reg[0];
                        var i = el.search(reg);
                        if (after) { i += reg.length - 1 }
                        return before.string(el, i, val, after)
                    },
                    array: function (el, reg, val, after) {
                        if (reg === undefined || val === undefined) { return el }
                        if (is(reg, 'number')) { reg = Math.abs(reg); return doSlice(el, after ? reg + 1 : reg, after ? reg + 1 : reg, val) }
                        if (reg === '') { return el }
                        var i, k = el.length;
                        if (!is(reg, 'regexp')) { reg = new RegExp('^' + reg + '$', C.flags()) }
                        for (i = 0; i < k; i++) { if (reg.test(el[i])) { return before.array(el, i, val, after) } }
                        return el
                    },
                    // Renvoie le service NODE
                    node: function (el, reg, val, after, zkId) {
                        var nodes = (zkId === ZKID) ? el : (el.get()), beforeNode, t = is(val), tReg = is(reg);
                        el = $GET('NODE').$(nodes);
                        if (!addByValueType.hasOwnProperty(t)) { return el }
                        var newNodes = addByValueType[t](val);
                        each(nodes, function () {
                            if (tReg === 'number') {
                                beforeNode = this.v.children[Math.abs(reg)]
                            } else {
                                beforeNode = querySelector(this.v, reg)
                            }
                            if (beforeNode) {
                                each(newNodes, function () {
                                    var v = this.v.cloneNode(true);
                                    after ? insertAfter(v, beforeNode) : insertBefore(v, beforeNode);
                                    beforeNode = v
                                });
                            }
                        });
                        return el
                    },
                    // Renvoie le service NODE
                    nodeelement: function (el, reg, val, after) { return before.node([el], reg, val, after, ZKID) },
                    // Renvoie le service NODE
                    nodelist: function (el, reg, val, after) { return before.node(toArray(el), reg, val, after, ZKID) },
                    // Renvoie le service NODE
                    htmlcollection: function (el, reg, val, after) { return before.node(toArray(el), reg, val, after, ZKID) }
                },
                after = {
                    string: function (el, reg, val) { return before.string(el, reg, val, 1) },
                    array: function (el, reg, val) { return before.array(el, reg, val, 1) },
                    // Renvoie le service NODE
                    node: function (el, reg, val) { return before.node(el, reg, val, 1) },
                    nodeelement: function (el, reg, val) { return before.nodeelement(el, reg, val, 1) },
                    nodelist: function (el, reg, val) { return before.nodelist(el, reg, val, 1) },
                    htmlcollection: function (el, reg, val) { return before.htmlcollection(el, reg, val, 1) },
                },
                at = {
                    string: function (el, tab, val, zkId) {
                        if (tab === undefined || val === undefined) { return el }
                        if (is(val, 'array') && zkId !== ZKID) { val = val.join(C.sep()) }
                        if (!is(tab, 'array')) { tab = [tab] }
                        tab = nSortD(tab) ;
                        each(tab, function () {
                            var n = Math.abs(this.v);
                            if (is(n, 'number')){ el = doSlice(el, n, n, val) }
                        });
                        return el;
                    },
                    array: function (el, tab, val) { return at.string(el, tab, val, ZKID) },
                    // Renvoie le service NODE
                    node: function (el, tab, val, zkId) {
                        if(val === undefined){ return el }
                        var t = is(val), nodes = (zkId === ZKID) ? el : el.get();
                        el = $GET('NODE').$(nodes);
                        if (!addByValueType.hasOwnProperty(t)) { return el }
                        var newNodes = addByValueType[t](val);
                        each(nodes, function () {
                            var atNodes = G.at(this.v, tab).get();
                            each(atNodes, function(){
                                var atNode = this.v ;
                                each(newNodes, function () {
                                    insertBefore(this.v.cloneNode(true), atNode);
                                });
                            }) ;
                        });
                        return el
                    },
                    // Renvoie le service NODE
                    nodeelement: function (el, tab, val) { return at.node([el], tab, val, ZKID) },
                    // Renvoie le service NODE
                    nodelist: function (el, tab, val) { return at.node(toArray(el), tab, val, ZKID) },
                    // Renvoie le service NODE
                    htmlcollection: function (el, tab, val) { return at.nodelist(el, tab, val) }
                } ;
                // Si isConcat === true     => La nouvelle valeur est ajoutée à l'ancienne valeur
                var Attr = {
                        // Renvoie le service NODE
                        node: function (el, attr, attrVal, isConcat, zkId) {
                            var nodes = (zkId === ZKID) ? el : el.get() ;
                            el = $GET('NODE').$(nodes);
                            if(attrVal === undefined){ return el}
                            attr = trim(attr+'').toLowerCase() ;
                            each(nodes, function(){
                                var newVal = attrVal ;
                                if(isConcat === true){
                                    var oldVal = this.v.getAttribute(attr) ;
                                    if(oldVal){
                                        if(attr === 'class'){ newVal = ' ' + trim(newVal+'') }
                                    }
                                    newVal = oldVal ? ( oldVal += newVal ) : newVal ;
                                }
                                this.v.setAttribute(attr, newVal)
                            }) ;
                            return el
                        },
                        nodeelement: function (el, attr, attrVal, isConcat) { return Attr.node([el], attr, attrVal, isConcat, ZKID) },
                        nodelist: function (el, attr, attrVal, isConcat) { return Attr.node(toArray(el), attr, attrVal, isConcat, ZKID) },
                        htmlcollection: function (el, attr, attrVal, isConcat) { return Attr.nodelist(el, attr, attrVal, isConcat, isConcat) },
                    },
                    attrs = ['Class', 'Id'] ;
                each(attrs, function () {
                    var attr = this.v.toLowerCase();
                    This[attr] = function (el, attrVal, isConcat) { return This.attr(el, attr, attrVal, isConcat) }
                    AF['add' + this.v] = function (attrVal, isConcat) { return This.attr(this, attr, attrVal, isConcat) }
                });
                var Style = {
                    // Renvoie le service NODE
                    node: function (el, style, styleVal, zkId) {
                        var nodes = (zkId === ZKID) ? el : el.get() ;
                        el = (zkId === ZKID) ? $GET('NODE').$(nodes) : el ;
                        if(styleVal === undefined){ return el}
                        var newStyle = style + ':' + styleVal ;
                        el = $GET('REMOVE').style(el, style);

                        each(nodes, function(){
                            var oldStyle = trim(this.v.getAttribute('style'), ';') ;
                            oldStyle = oldStyle ? (oldStyle+';'+newStyle) : newStyle ;
                            this.v.setAttribute('style', oldStyle)
                        }) ;
                        return el
                    },
                    nodeelement: function (el, style, styleVal) { return Style.node([el], style, styleVal, ZKID) },
                    nodelist: function (el, style, styleVal) { return Style.node(toArray(el), style, styleVal, ZKID) },
                    htmlcollection: function (el, style, styleVal) { return Style.nodelist(el, style, styleVal) },
                } ;
                var styles = ['Color','Margin','Padding','Border','Width','Height','Background','Cursor','Position'] ;
                each(styles, function () {
                    var style = this.v.toLowerCase();
                    This[style] = function (el, val) { return This.style(el, style, val) }
                    AF['add' + this.v] = function (val) { return This.style(this, style, val) }
                }) ;
                /**
                 * Permet d'ajouter le style left
                 * @param el
                 * @param val {String/Number}
                 *      - On peut préciser px ou % ...
                 * @returns {*}
                 */
                This.x = function (el, val) { return This.style(el, 'left', val+'') };
                AF.addX = function (val) { return This.x(this, val) } ;
                // Même fonctionnement que This.x
                This.y = function (el, val) { return This.style(el, 'top', val+'') };
                AF.addY = function (val) { return This.y(this, val) } ;
                // Si isConcat === true     => Alors on fait une concaténation
                var text = {
                    // Renvoie le service NODE
                    node: function (el, textVal, isConcat, zkId) {
                        var nodes = (zkId === ZKID) ? el : el.get();
                        el = $GET('NODE').$(nodes) ;
                        if(textVal === undefined){ return el}
                        each(nodes, function () {
                            var name = this.v.nodeName.toLowerCase();
                            if(name == 'input' || name == 'textarea'){
                                if (isConcat === true) { this.v.value += textVal } else { this.v.value = textVal }
                            }else{
                                if(isConcat === true){ this.v.appendChild(document.createTextNode(textVal)) } else { this.v.textContent = textVal }
                            }
                        });
                        return el
                    },
                    nodeelement: function (el, textVal, isConcat) { return text.node([el], textVal, isConcat, ZKID) },
                    nodelist: function (el, textVal, isConcat) { return text.node(toArray(el), textVal, isConcat, ZKID) },
                    htmlcollection: function (el, textVal, isConcat) { return text.nodelist(el, textVal, isConcat) },
                } ;
                This.value = function(el, value, isConcat){ return This.text(el, value, isConcat) };
                AF.addValue = function(value, isConcat){ return This.value(this, value, isConcat) };
                // Si isConcat === true     => Alors on fait une concaténation
                var html = {
                    // Renvoie le service NODE
                    node: function (el, htmlVal, isConcat, zkId) {
                        var nodes = (zkId === ZKID) ? el : el.get();
                        el = $GET('NODE').$(nodes) ;
                        if(htmlVal === undefined){ return el}
                        each(nodes, function () {
                            if (isConcat === true) {
                                var oldHtml = (this.v.innerHTML) + '' + htmlVal ;
                                this.v.innerHTML = oldHtml
                            } else {
                                this.v.innerHTML = htmlVal
                            }
                        });
                        return el
                    },
                    nodeelement: function (el, htmlVal, isConcat) { return html.node([el], htmlVal, isConcat, ZKID) },
                    nodelist: function (el, htmlVal, isConcat) { return html.node(toArray(el), htmlVal, isConcat, ZKID) },
                    htmlcollection: function (el, htmlVal, isConcat) { return html.nodelist(el, htmlVal, isConcat) },
                } ;
                function setAdds(ob, name) {
                    var name2 = name.toLowerCase();
                    This[name2] = function (el, nb, other, other2) {
                        var t = is(el);
                        if (nb === undefined) { return addByEmptyOpt.hasOwnProperty(name2) ? addByEmptyOpt[name2](el) : el }
                        return ob['hasOwnProperty'](t) ? ob[t](el, nb, other, other2) : el
                    }
                    AF['add' + name] = function (nb, other, other2) { return This[name2](this, nb, other, other2) } ;
                }
                var forSetAdds = {
                    Middle: middle, First: first, Last: last, Both: both, Before: before, After: after, At: at,
                    Attr: Attr, /*Css: Style, */Style: Style, Text: text, Html: html,
                } ;
                each(forSetAdds, function () { setAdds(this.v, this.k) }) ;
                This.add = function (el, val, isConcat) {
                    return This[(is(val,'string'))?'html':'last'](el, val, isConcat) ;
                };
                AF.add = function (html, isConcat) { return This.add(this, html, isConcat) } ;
                setProto('ADD', AF);
            }
            $SET('ADD', new ADD());


            // Service UPPER
            function UPPER(){
                var This = this, C = $GET('CONFIG'), UF={}, G = $GET('GET'), CL = $GET('CLEAR');
                var defaultsValues = {
                    first: 1,
                    last: 1,
                    both: 1,
                    between: [0,0]
                } ;
                function setUpper(ob,name){
                    var name2 = name.toLowerCase() ;
                    This[name2] = function (el,nb) {
                        var t = is(el);
                        if(nb===undefined && defaultsValues.hasOwnProperty(name2)){nb = defaultsValues[name2]}
                        return ob['hasOwnProperty'](t) ? ob[t](el,nb) : el
                    }
                    UF["upper"+name] = function (nb) { return This[name2](this,nb) };
                }
                function upperLowerTab(tab, UL) {
                    UL = (UL === 'Lower') ? UL : 'Upper';
                    each(tab, function(){
                        var v = this.v;
                        if(is(v, 'string')){ v = v['to' + UL + 'Case']() }
                        return v
                    }) ;
                    return tab;
                }
                var middle = {
                    string: function (el, UL, isArray) {
                        var l = el.length, x = (l % 2) ? 1 : 2, n = parseInt(l / 2), md;
                        md = (x == 1) ? el.slice(n, n + 1) : el.slice(n - 1, n + 1);
                        UL = (UL === 'Lower') ? UL : 'Upper';
                        md = isArray ? (upperLowerTab(md, UL)) : (md['to'+UL+'Case']()) ;
                        return doSlice(el, (x == 2) ? n - 1 : n, n + x - (x - 1), md);
                    },
                    array: function (el, UL) { return middle.string(el, UL, 1) }
                };
                //setUpper(middle,"Middle");
                var first = {
                    string: function (el, nb, UL, last, isArray) {
                        var i, r;
                        UL = (UL === 'Lower') ? UL : 'Upper';
                        if (is(nb, 'number')) {
                            nb = Math.abs(nb);
                            var firstLast = last ? (el.slice(-nb)) : (el.slice(0, nb)) ;
                            el = last ? (el.slice(0,nb)) : (el.slice(nb)) ;
                            firstLast = isArray ? (upperLowerTab(firstLast, UL)) : (firstLast['to'+UL+'Case']()) ;
                            return last ? el.concat(firstLast) : firstLast.concat(el);
                        } else {
                            if (nb === ''){ return el }
                            if (is(nb, 'regexp')) {
                                var ig = last?'g':''; if (nb.ignoreCase) { ig += 'i' } nb = new RegExp(nb, ig);
                            }else{
                                nb = new RegExp(nb, last?'g':'')
                            }
                            if (last) {
                                r = el.match(nb);
                                if (!r){ return el }
                                nb = r[r.length - 1];
                                i = el.lastIndexOf(nb);
                                nb = nb['to' + UL + 'Case']();
                                return doSlice(el, i, i + (nb.length), nb);
                            } else {
                                return el.replace(nb, function (str) {
                                    return str['to' + UL + 'Case']()
                                })
                            }
                        }
                    },
                    array: function (el, nb, UL, last) {
                        var i, k, r;
                        if (is(nb, 'number')) {
                            return first.string(el, nb, UL, last, 1) ;
                        } else {
                            if (nb === ''){ return el }
                            UL = (UL === 'Lower') ? UL : 'Upper';
                            k = el.length;
                            r = RegExp(nb, C.flag);
                            if (is(nb, 'regexp')) {
                                var ig = ''; if (nb.ignoreCase) { ig += 'i' } r = new RegExp(nb, ig);
                            }else{
                                r = new RegExp('^'+nb+'$', '')
                            }
                            if (last) {
                                for (i = k - 1; i > -1; i--) {
                                    if (r.test(el[i])) {
                                        el[i] = el[i]['to' + UL + 'Case']();
                                        return el;
                                    }
                                }
                            } else {
                                for (i = 0; i < k; i++) {
                                    if (r.test(el[i])) {
                                        if(is(el[i], 'string')){ el[i] = el[i]['to' + UL + 'Case']() }
                                        return el;
                                    }
                                }
                            }
                            return el;
                        }
                    }
                };
                //setUpper(first,"First");
                var last = {
                    string: function (el, nb, UL) { return first.string(el, nb, UL, 1) },
                    array: function (el, nb, UL) { return first.array(el, nb, UL, 1) },
                };
                //setUpper(last,'Last');
                var opts = { Middle: middle, First: first, Last: last,};
                each(opts, function(){ setUpper(this.v, this.i) });

                var both = {
                    string: function (el,UL, nb) { return last.string(first.string(el,UL, nb),UL, nb) },
                    array: function (el,UL, nb) { return last.array(first.array(el,UL, nb),UL, nb) },
                };
                setUpper(both,'Both');
                var before = {
                    string: function (el,UL, nb, after) {
                        var i, tp;
                        if (is(nb, 'number')) {
                            nb = Math.abs(nb);
                            tp = after ? el.slice(nb + 1) : el.slice(0, nb);
                            el = after ? el.slice(0, nb + 1) : el.slice(nb);
                            tp = tp['to' + UL + 'Case']();
                            return after ? el.concat(tp) : tp.concat(el);
                        } else {
                            nb += '';
                            if (nb === '') return el;
                            var reg = RegExp(nb, C.flag);
                            el += '';
                            i = el.search(reg);
                            if (!(i + 1)) return el;
                            if (after) el.replace(reg, function (str) {
                                i += str.length - 1
                            });
                            return This.before(el, [i], after, UL);
                        }
                    },
                    array: function (el,UL, nb, after) {
                        var i, k = el.length, tp;
                        if (is(nb, 'number')) {
                            nb = Math.abs(nb);
                            tp = after ? el.slice(nb + 1) : el.slice(0, nb);
                            el = after ? el.slice(0, nb + 1) : el.slice(nb);
                            tp = upperLowerTab(tp, UL);
                            return after ? el.concat(tp) : tp.concat(el);
                        } else {
                            nb += '';
                            if (nb === '') {
                                return el
                            }
                            var reg = RegExp(nb, C.flag);
                            for (i = 0; i < k; i++) {
                                if (reg.test(el[i])) {
                                    return This.before(el, [i], after, UL)
                                }
                            }
                            return el;
                        }
                    }
                };
                setUpper(before,'Before');
                var after = {
                    string : function(el,UL,nb){ return before.string(el,UL,nb,1)},
                    array : function(el,UL,nb){ return before.array(el,UL,nb,1)}
                };
                setUpper(after,'After');
                var between = {
                    string: function (el,UL, tab) {
                        var i, j, t, k = tab.length, res = (is(el, 'string')) ? '' : [];
                        if (k % 2) {
                            tab.push(el.length - 1)
                        }
                        for (i = 0; i < k; i += 2) {
                            t = nSort([tab[i], tab[i + 1]]);
                            t[0] = Math.abs(t[0]);
                            t[1] = Math.abs(t[1]);
                            if (is(t[0], 'number') && is(t[1], 'number')) {
                                el += '';
                                el = doSlice(el, t[0] + 1, t[1], el.slice(t[0] + 1, t[1])['to' + UL + 'Case']());
                            }
                        }
                        return el;
                    },
                    array: function (el,UL, tab) {
                        var i, t, k = tab.length, res = (is(el, 'string')) ? '' : [];
                        if (k % 2) {
                            tab.push(el.length - 1)
                        }
                        for (i = 0; i < k; i += 2) {
                            t = nSort([tab[i], tab[i + 1]]);
                            t[0] = Math.abs(t[0]);
                            t[1] = Math.abs(t[1]);
                            if (is(t[0], 'number') && is(t[1], 'number')) {
                                el = doSlice(el, t[0] + 1, t[1], upperLowerTab(el.slice(t[0] + 1, t[1]), UL));
                            }
                        }
                        return el;
                    }
                };
                setUpper(between,'Between');
                var at = {
                    string: function (el,UL, tab) {
                        var i, k = tab.length, K = el.length, n;
                        for (i = 0; i < k; i++) {
                            n = Math.abs(tab[i]);
                            if (is(n, 'number')) {
                                el += '';
                                el = doSlice(el, n, n + 1, el.slice(n, n + 1)['to' + UL + 'Case']());
                            }
                        }
                        return el;
                    },
                    array: function (el,UL, tab) {
                        var i, k = tab.length, K = el.length, n;
                        for (i = 0; i < k; i++) {
                            n = Math.abs(tab[i]);
                            if (is(n, 'number')) {
                                if (is(el[n], 'string')) {
                                    el[n] = el[n]['to' + UL + 'Case']()
                                }
                            }
                        }
                        return el;
                    }
                };
                setUpper(at,'At');
                /**
                 * Recherche par RegExp.
                 *  NOTES :
                 *      - Evitez les pseudo class comme \d \w ...
                 *      - Pour les drapeux, utilisez le service CONFIG
                 *      - nodeelement, nodelist, htmlcollection, on peut indiquer le nom de l'élément en minuscule
                 *      - On ne peut obtenir de noeud text
                 * @type {{string: Function, array: Function, nodeelement: Function, nodelist: Function, htmlcollection: Function}}
                 */
                var all = {
                    string: function (el, UL, nb) {
                        if (nb === '') return el;
                        el = el.replace(RegExp(nb,C.flag), function (str) {
                            return str['to' + UL + 'Case']()
                        });
                        return el;
                    },
                    array: function (el,UL,nb) {
                        if (nb === '') return el;
                        var i, k = el.length, reg;
                        reg = RegExp(nb, C.flag);
                        for (i = 0; i < k; i++) {
                            if (reg.test(el[i]) && is(el[i], 'string')) {
                                el[i] = el[i]['to' + UL + 'Case']();
                            }
                        }
                        return el;
                    }
                };
                setUpper(all,'All');
                // A finir
                var upperByEmptyOpt = {
                    string: function (el) { return el.toUpperCase() },
                    array: function (el) {
                        each(el, function(){
                            if(is(this.v, 'string')){ return this.v.toUpperCase() }
                        });
                        return el
                    },
                    node: function (el,zkId) {
                        var nodes = (zkId===ZKID)?el:el.get();
                        each(nodes, function () { this.v.parentNode.removeChild(this.v) });
                        return $GET('NODE').$([])
                    },
                    // Renvoie le service NODE
                    nodeelement: function (el) { return clearByEmptyOpt.node([el],ZKID) },
                    // Renvoie le service NODE
                    nodelist: function (el) { return clearByEmptyOpt.node(toArray(el),ZKID) },
                    // Renvoie le service NODE
                    htmlcollection: function (el) { return clearByEmptyOpt.nodelist(el) }
                };
                This.upper = function (el, reg) {
                    var t = is(reg);
                    if (t === 'string') { return This.all(el, reg) }
                    if (t === 'array' || t === 'number') { return This.at(el, reg) }
                    t = is(el); return (upperByEmptyOpt.hasOwnProperty(t)) ? upperByEmptyOpt[t](el) : el
                };
                UF.upper = function (reg) { return This.upper(this,reg) };

                setProto('UPPER',UF);
            }
            $SET('UPPER',new UPPER());


        // ---------------------------------------------------------------

            // Service MAP : factory
            function MAP() {
                var This = this, gMap, view = null, Lat = 48.8534100, Lng = 2.3488000;

                var mapOptions = {
                    center:new google.maps.LatLng(Lat,Lng),
                    zoom:5,
                    mapTypeId:google.maps.MapTypeId.ROADMAP
                };

                // Stocke tous les markers
                var markers = {};

                var rewriteOptions = {
                    position: function(arrayPos){
                        if(is(arrayPos, "array")){ return new google.maps.LatLng(arrayPos[0],arrayPos[1]) }
                        return null;
                    },
                    animation: function(type){
                        return google.maps.Animation[(""+type).toUpperCase()];
                    }, /* DROP BOUNCE */
                };

                // Renvoie null ou MAP
                This.view = function(v){
                    view = document.querySelector(v);
                    if(!view){ return view = null }
                    view = $GET('NODE').$(view);
                    return This;
                };

                // Renvoie MAP
                This.show = function(lat, lng){
                    if(is(lat, 'number')){ Lat = lat }
                    if(is(lng, 'number')){ Lng = lng }
                    mapOptions.center = new google.maps.LatLng(Lat,Lng);
                    if(!gMap){
                        if(view){
                            gMap = new google.maps.Map(view.get()[0], mapOptions);
                        }
                    }else{
                        if(is(lat, 'number')){ Lat = lat }
                        if(is(lng, 'number')){ Lng = lng }
                        gMap.setCenter(mapOptions.center);
                    }
                    return This;
                };

                // Renvoie Number (zoom) ou MAP
                This.zoom = function(z){
                    if(z === undefined){ return gMap.getZoom() }
                    gMap.setZoom(z);
                    return This;

                };

                // Renvoie String (type map) ou MAP
                // HYBRID    ROADMAP    SATELLITE    TERRAIN
                This.type = function(t){
                    if(t === undefined){ return gMap.getMapTypeId() }
                    gMap.setMapTypeId((t+'').toUpperCase());
                    return This;
                };

                /**
                 * setMarker
                 *
                 * @param name
                 *      C'est le nom qui représente le marker
                 *
                 * @param optsLat
                 *      Configuration du marker.
                 *      - Type :
                 *          object : Objet de configuration  =>  { position: [Lat, Lng] }
                 *          number : La latitude  =>  48.8534100
                 *
                 * @param lng
                 *      La longitude
                 *      - Type :
                 *          number : La latitude  =>  2.3488000
                 *
                 * @returns {MAP}
                 */
                This.setMarker = function(name, optsLat, lng){
                    if(!gMap){
                        This.show();
                    }
                    if(is(optsLat, "number") && is(lng, "number")){
                        optsLat = {position: [optsLat, lng]};
                    }

                    if(is(optsLat, "object")){
                        each(optsLat, function(){
                            if(rewriteOptions.hasOwnProperty(this.k)){
                                return rewriteOptions[this.k](this.v);
                            }
                        });
                        optsLat.map = gMap;
                        markers[name] = new google.maps.Marker(optsLat);
                    }
                    return This;
                };

                This.removeMarker = function(name){
                    if(markers[name]){
                        markers[name].setMap(null);
                    }
                    return This;
                }
            }
            //$SET('MAP', new MAP());

            // Service FORM
            function FORM() { }
            $SET('FORM', new FORM());

        // ---------------------------------------------------------------

            // Service DATE : multiple
            function DATE() {
                var This = this, date = new Date(), C = $GET('CONFIG');
                // Renvoie un String ou le service DATE
                function getSetDate(nb, what){
                    if(nb === undefined){ return (date['get'+what]()+((what==='Month')?1:0))+'' }
                    if (is(nb, 'number')) {
                        nb = Math.abs(nb);
                        if (nb > 0) {
                            try {
                                date['set' + what](nb-((what==='Month')?1:0))
                            } catch (e) {
                                date.setDate(nb)
                            }
                        }
                        return This
                    }
                    if(/[\+\-]\d+/.test(nb)){
                        nb = (new Function("","return " + date['get'+what]() + nb))() ;
                        try { date['set'+what](nb) } catch (e) { date.setDate(nb) }
                    }
                    return This
                }
                // Renvoie le nombre de jours dans un mois
                function daysInMonth(el) { return new Date(el.getFullYear(), el.getMonth() + 1, 0).getDate() }
                /**
                 * @param nb
                 *      - si nb === undefined    => On renvoit un String correspondant à l'année
                 *      - si nb est un Number   => On fait un setFullYear
                 *      - si nb === '+2' ou '-2' par exemple    => On ajoute ou on retire ce nombre
                 * @returns {*}
                 */
                This.y = function (nb) {
                    var res = getSetDate(nb, 'FullYear') ;
                    if(nb === undefined){ res = res.slice(-2)}
                    return res
                };
                This.yy = function (nb) {
                    return getSetDate(nb, 'FullYear') ;
                };
                /*This.m = function (nb) { return getSetDate(nb, 'Month') };
                This.mm = function (nb) {
                    var res = getSetDate(nb, 'Month') ;
                    if(nb === undefined){ res = formatNumToStr(res, 2) }
                    return res
                };*/
                // Renvoie un String correspondant au mois. nb sert à indiquer la longueur de la chaine
                This.M = function (nb, zkId) {
                    var mois = C[(zkId===ZKID)?'days':'months']()[(zkId===ZKID)?This.w():date.getMonth()] ;
                    if(nb === undefined){ nb = 3 };
                    if(is(nb, 'number')){ mois = mois.slice(0,Math.abs(nb)) }
                    return mois
                };
                This.MM = function (nb) {
                    if(nb === undefined){ return C.months()[date.getMonth()] }
                    return This.M(nb)
                };
                This.w = function () { return (date.getDay()||7)-1 };
                // Renvoie un String correspondant au jour de la semaine. nb sert à indiquer la longueur de la chaine
                This.D = function (nb) { return This.M(nb, ZKID) };
                This.DD = function (nb) {
                    if(nb === undefined){ return C.days()[This.w()] }
                    return This.D(nb)
                };
                var symbols = {
                    m: 'Month',
                    d: 'Date',
                    h: 'Hours',
                    i: 'Minutes',
                    s: 'Seconds',
                    l: 'Milliseconds'
                } ;
                each(symbols, function(){
                    var i = this.i, v = this.v ;
                    This[i] = function (nb) { return getSetDate(nb, v) };
                    This[i+i] = function (nb) {
                        var res = getSetDate(nb, v) ;
                        if(nb === undefined){ res = formatNumToStr(res, 2) }
                        return res
                    };
                }) ;
                This.day = function(d){ return This.dd(d) };
                This.month = function(m){ return This.mm(m) };
                This.year = function(y){ return This.yy(y) };
                This.hour = function(h){ return This.hh(h) };
                This.minute = function(i){ return This.ii(i) };
                This.second = function(s){ return This.ss(s) };
                This.millisecond = function(l){ return This.ll(l) };
                /**
                 * Permet le formatage d'une date
                 * @param str {String}
                 *      - Exemple : "%DD %dd+1 %MM %yy"
                 * @returns {*}
                 */
                This.format = function(str){
                    if(str === undefined){ return ''}

                    str += '' ;
                    str = str.replace(/(\%\w{1,2})([+-]\d+)?/g, function (str, s1, s2) {
                        s1 = s1.slice(1);
                        if (This.hasOwnProperty(s1)) { This[s1](s2); return '%' + s1 }
                        return str;
                    });
                    str = str.replace(/\%\w{1,2}/g, function (str) {
                        str = str.slice(1);
                        if (This.hasOwnProperty(str)) { return This[str]() }
                        return str;
                    });
                    return str
                } ;
                /**
                 * Renvoie le nombre de jours dans un mois ou le nombre de lundi par exemple
                 * @param str
                 *      - str === undefined     => Nombre de jours dans le mois en cours
                 *      - str === "Lundi"     => Nombre de Lundi dans le mois en cours
                 * @returns {*}
                 */
                This.count = function(str){
                    var totalDays = daysInMonth(date) ;
                    if(str === undefined){ return totalDays }
                    var total = 0, reg = new RegExp('^'+str+'$','i') ;
                    var copyDate = cloneObject(date) ;
                    each(totalDays, function(){
                        date.setDate(this.i+1) ;
                        if(reg.test(This.DD())){ total++ }
                    }) ;
                    date = copyDate ;
                    return total
                } ;
                /**
                 * Permet d'obtenir des dates à avenir
                 * @param str {mixed}
                 *      - str === undefined     => Retourne la date correspondant au jour suivant
                 *      - str === "Lundi"       => Retourne la date correspondant au Lundi suivant
                 *      - str === "Janvier"     => Retourne la date correspondant au Janvier suivant
                 * @returns {*}
                 */
                This.next = function(str){
                    if(str===undefined){ return This.d('+1') }
                    var reg = new RegExp('^'+str+'$','i');

                    // Faire la recherche pour les nombres
                    //      vérifier si 0<str<32

                    // Recherche pour les jours
                    var days = C.days();
                    days = days.concat(days).slice(This.w()+1);
                    var i, k = days.length ;
                    for(i=0 ; i<k ; i++){
                        //var v = i+1+parseInt(This.d(),10);
                        if(reg.test(days[i])){ This.d(i+1+parseInt(This.d(),10)); return This }
                    }
                    // Recherche pour les mois
                    var months = C.months();
                    months = months.concat(months).slice(date.getMonth()+1) ;
                    var i, k = months.length ;
                    for(i=0 ; i<k ; i++){
                        if(reg.test(months[i])){ date.setMonth(date.getMonth()+i+1); return This }
                    }

                    return This

                } ;
                // Fonctionne comme This.next
                This.previous = function(str){
                    if(str===undefined){ return This.d('-1') }
                    var reg = new RegExp('^'+str+'$','i');

                    // Faire la recherche pour les nombres

                    // Recherche pour les jours
                    var days = C.days();
                    days = days.concat(days.slice(0,This.w())) ;
                    console.log(days);
                    var i, k = days.length-1 ;
                    for(i=k ; i>-1 ; i--){
                        if(reg.test(days[i])){ date.setDate(date.getDate()-k+i-1); return This }
                    }
                    // Recherche pour les mois
                    var months = C.months();
                    months = months.concat(months.slice(0,date.getMonth())) ;
                    var i, k = months.length-1 ;
                    for(i=k ; i>-1 ; i--){
                        if(reg.test(months[i])){ date.setMonth(date.getMonth()-k+i-1); return This }
                    }

                    return This
                } ;
                This.now = function(){ date = new Date(); return This };
                This.show = function(x,y,view, isHide, globalContainer) {

                    var calendarDate = $GET('DATE');
                    var format = C.dateFormat();

                    if(!document.querySelector('.zk-cal-container')){
                        var calContainer = $GET('NODE').create('div', {
                            class: 'zk-cal-container',
                            style: 'position: absolute; left: '+x+'; top: '+y,
                        });
                        if(globalContainer){
                            $GET('NODE').$(globalContainer).add(calContainer);
                        }else {
                            $GET('NODE').$('body').add(calContainer);
                        }

                    }
                    /*--------------- Header -----------------*/
                    var calHeader = $GET('NODE').create('div', {'class': 'zk-cal-header-container'}),
                        arrowLeft = $GET('NODE').create('p', {'class': 'zk-cal-arrow-left'}),
                        calMonthYear = $GET('NODE').create('p', {'class': 'zk-cal-month-year', html: calendarDate.MM()+'&nbsp;&nbsp;&nbsp;'+calendarDate.yy()}),
                        arrowRight = $GET('NODE').create('p', {'class': 'zk-cal-arrow-right'});
                    calHeader.add(arrowLeft).add(calMonthYear).add(arrowRight);

                    /*--------------- Weeks -----------------*/
                    var calWeeks = $GET('NODE').create('div', {'class': 'zk-cal-weeks-container'}),
                        jour = $GET('CONFIG').days();
                    jour.each(function () {
                        calWeeks.add($GET('NODE').create('p', {'class': 'zk-cal-week', text: this.v.getFirst(3)}));
                    });

                    /*--------------- Days -----------------*/
                    var calDays = $GET('NODE').create('div', {'class': 'zk-cal-days-container'}),
                        div = $GET('NODE').create('div');
                    (42).each(function () {
                        div.add($GET('NODE').create('p', {class: 'zk-cal-day'}));
                        if ((this.i + 1) % 7 === 0) {
                            calDays.add(div);
                            div = $GET('NODE').create('div');
                        }
                    });

                    /*--------------- Footer -----------------*/
                    var calFooter = $GET('NODE').create('div', {'class': 'zk-cal-footer-container'}),
                        dateNow = $GET('NODE').create('p', {'class': 'zk-cal-date-now', 'text': calendarDate.format('%D. %dd %MM %yy')}),
                        hourNow = $GET('NODE').create('p', {'class': 'zk-cal-hour-now', 'text': calendarDate.format('%hh:%ii:%ss')});
                    calFooter.add(dateNow).add(hourNow);
                    var timer = setInterval(function(){
                        if(!document.querySelector('.zk-cal-container')){
                            clearInterval(timer);
                        } else {
                            var dt = $GET('DATE');
                            $GET('NODE').$('.zk-cal-date-now').text(dt.format('%D. %dd %MM %yy'));
                            $GET('NODE').$('.zk-cal-hour-now').text(dt.format('%hh:%ii:%ss'));
                        }

                    }, 1000);

                    /*--------------- close -----------------*/
                    var calClose = $GET('NODE').create('div', {'class': 'zk-cal-actions-container'}),
                        close = $GET('NODE').create('p', {'class': 'zk-cal-close', 'text': 'Fermer'});
                    calClose.add(close);

                    /*--------------- Ajout de tous les conteneurs -----------------*/
                    if(calContainer){ calContainer.add(calHeader).add(calWeeks).add(calDays).add(calFooter).add(calClose) }


                    /*--------------- Définition des fonctions -----------------*/
                    function showMonthYear(){ $GET('NODE').$('.zk-cal-month-year').html(calendarDate.MM()+'&nbsp;&nbsp;&nbsp;'+calendarDate.yy()) }
                    function showDays(){
                        var w = calendarDate.day(1).w(),
                            m = calendarDate.m(),
                            classes = ['zk-cal-day-previous', 'zk-cal-day', 'zk-cal-day-next'],
                            cl = (w===0) ? 1 : -1;
                        calendarDate.d('-' + w);
                        $GET('NODE').$("p[class^='zk-cal-day'").each(function () {
                            if(calendarDate.m() !== m){ cl++; m = calendarDate.m() }
                            var node = this.node, dt = new Date();
                            node.innerHTML = calendarDate.d();
                            node.className = classes[cl];
                            node.setAttribute('zk-date', calendarDate.format(format));
                            var yy = parseInt(calendarDate.yy(),10),
                                mm = parseInt(calendarDate.mm(),10),
                                dd = parseInt(calendarDate.dd(),10),
                                yyy = dt.getFullYear(),
                                mmm =dt.getMonth()+1,
                                ddd = dt.getDate();
                            if((yy===yyy) && (mm===mmm) && (dd===ddd)){ node.className = 'zk-cal-day-now' }
                            calendarDate.d('+1');
                        });
                        calendarDate.m('-1').d(1);
                        $GET('NODE').$("p[class^='zk-cal-day'").click(function(){
                            if(!is(view, 'node')){ view = $GET('NODE').$(view) }
                            view.text(this.node.getAttribute('zk-date'));
                            if(isHide === true){ $GET('NODE').$('.zk-cal-container').remove() }
                        });
                    }
                    showDays();

                    /*--------------- Ajout des évènements -----------------*/
                    $GET('NODE').$('.zk-cal-arrow-left, .zk-cal-arrow-right').click(function(){
                        calendarDate.m((/zk\-cal\-arrow\-left/.test(this.node.className))?'-1':'+1');
                        showMonthYear();
                        showDays();
                    });
                    $GET('NODE').$('.zk-cal-date-now').click(function(){
                        calendarDate.now();
                        showMonthYear();
                        showDays();
                    });
                    $GET('NODE').$('.zk-cal-close').click(function(){
                        $GET('NODE').$('.zk-cal-container').remove()
                    });

                    return This;
                }
                This.hide = function() { $GET('NODE').$('.zk-cal-container').remove() }

            }
            //$SET('DATE', new DATE());

            // Service NODE : Permet de travailler sur le DOM
            var positionUsingNode = {
                right: function(fixedEl, floatEl, somme){
                    var G = $GET('GET');
                    return {x: G.x(fixedEl)+G.width2(fixedEl) + somme, y: G.y(fixedEl)}
                },
                bottom: function(fixedEl, floatEl, somme){
                    var G = $GET('GET');
                    return {x: G.x(fixedEl), y: G.y(fixedEl) + G.height2(fixedEl) + somme}
                },
                top: function(fixedEl, floatEl, somme){
                    var G = $GET('GET');
                    return {x: G.x(fixedEl), y: G.y(fixedEl) - (G.height2(floatEl) + somme)}
                },
                left: function(fixedEl, floatEl, somme){
                    var G = $GET('GET');
                    return {y: G.y(fixedEl), x: G.x(fixedEl) - (G.width2(floatEl)+somme) }
                },
                /*mouse: function(fixedEl, floatEl, somme, ev){
                    return {x: ev.clientX+somme, y: ev.clientY+somme} ;
                },*/
            } ;
            // Service NODE  : multiple
            function NODE() {
                var This = this, nodes = [], G = $GET('GET'), A = $GET('ADD') ;
                var infoID = 'info'+parseInt(Math.random() * 100000), configForInfo = {
                    on: 'over', off: 'out', view: 'div.zk-info', position: 'right'
                } ;
                var submenuID = 'submenu'+parseInt(Math.random() * 100000), configForSubmenu = {
                    on: 'over',
                    off: 'out', /* Mettre la valeur à false si on veut le laisser toujours visible */
                    view: 'ul.zk-submenu',
                    viewEvent: 'out',
                    viewFunc: function(){ var view = $GET('NODE').$(this.node); removeItemsEventFunc(view); view.remove() } ,
                    itemsView: 'li.zk-submenu-items',
                    itemsEvent: 'click',
                    itemsFunc: function(){ This.$('.zk-submenu').remove() },
                    position: 'bottom',
                    fullscreen: false,
                } ;
                function removeItemsEventFunc(view){
                    var ch = view.children();
                    ch.off(configForSubmenu.itemsEvent);
                }
                // Permet de définir les valeurs par défaut des infobulles, submenu...
                function setFunctionsConfig(newObj, defaultObj){
                    if(!is(newObj, 'object')){ newObj = defaultObj; return newObj }
                    each(defaultObj, function(){
                    	var i = this.i ;
                        if(!newObj.hasOwnProperty(i)){
                            newObj[i] = this.v;
                        }
                    });
                    return newObj
                }

                /*--------------------------------------------------------------*/
                    This.remove = function (reg) { return $GET('REMOVE').remove(This, reg) } ;
                    /**
                     * Permet d'afficher une infobulle
                     * @param text {String}     Le texte à afficher dans l'info bulle. J'utilise innerHTML
                     * @param objConfig {Object}    Objet de configuration
                     *      - on    =   Evénement qui affichera l'info-bulle
                     *      - off    =   Evénement qui masquera l'info-bulle
                     *      - view    =   Le conteneur du texte
                     *      - position    =   La position. 4 positions sont possibles : top right bottom left. On peut faire des calculs : top+10 left-5
                     *          => Valeurs par défault : { on: 'over', off: 'out', view: 'div.zk-info', position: 'right' }
                     * @returns {NODE}
                     */
                    This.info = function(text, objConfig){
                        if(text === undefined || !nodes[0] ){ return This }
                        objConfig = setFunctionsConfig(objConfig, configForInfo);

                        var pos, position = objConfig.position, somme = '0';
                        position.replace(/^([a-z0-9]+)([\+\.\-]\d+)?/i, function(str, s1, s2){ pos = s1; somme = s2 });
                        somme = parseFloat(trim(somme, '+ '),10);
                        if(isNaN(somme)){ somme = 0 }
                        if(!positionUsingNode.hasOwnProperty(pos)){ pos = 'right' }
                        // Création de la vue
                        var view = createElementByCss(objConfig.view)[0];
                        if(!view){ view = createElementByCss('div.zk-info')[0] }
                        view = $GET('NODE').$(view);
                        view.add(text).position('absolute');
                        // Suppression des anciennes infobulles
                        This.off(infoID+'-'+objConfig.on).off(infoID+'-'+objConfig.off);
                        // Ajout des nouvelles infobulles
                        This.on(infoID+'-'+objConfig.on, function(){
                            $GET('ADD').last(document.body, view);
                            var xy = positionUsingNode[pos](this.node, view, somme, this.e);
                            view.x(xy.x).y(xy.y);
                        });
                        This.on(infoID+'-'+objConfig.off, function(){ view.remove() });

                        return This
                    } ;
                    // Voir configForSubmenu
                    // itemsObj est pour l'instant sous la forme {...}    => Faire le changement pour un tableau
                    This.submenu = function(itemsObj, objConfig){
                        if(itemsObj === undefined || !nodes[0] ){ return This }
                        if(!is(itemsObj, 'array|object')){ itemsObj = [itemsObj] }
                        objConfig = setFunctionsConfig(objConfig, configForSubmenu);

                        var pos, position = objConfig.position, somme = '0';
                        position.replace(/^([a-z0-9]+)([\+\.\-]\d+)?/i, function(str, s1, s2){ pos = s1; somme = s2 });
                        somme = parseFloat(trim(somme, '+ '),10);
                        if(isNaN(somme)){ somme = 0 }
                        if(!positionUsingNode.hasOwnProperty(pos)){ pos = 'bottom' }

                        // Création des vues
                        var view = createElementByCss(objConfig.view)[0];
                        if(!view){ view = createElementByCss('ul.zk-submenu')[0] }
                        view = $GET('NODE').$(view);
                        view.position('absolute');
                        view.on(configForSubmenu.viewEvent, configForSubmenu.viewFunc);
                        var isArray = is(itemsObj, 'array');
                        var itemsView = createElementByCss(objConfig.itemsView)[0];
                        if(!itemsView){ itemsView = createElementByCss('li.zk-submenu-items')[0] }
                        each(itemsObj, function(){
                            var cloneItemsView = itemsView.cloneNode(true);
                            $GET('EVENT').on(cloneItemsView, configForSubmenu.itemsEvent, configForSubmenu.itemsFunc);
                            cloneItemsView.innerHTML = isArray ? this.v : this.i ;
                            if(!isArray && cloneItemsView.nodeName.toLowerCase() === 'a'){
                                cloneItemsView.href = this.v ;
                            }
                            view.get()[0].appendChild(cloneItemsView) ;
                        });
                        // Suppression des anciens submenu
                        This.off(submenuID+'-'+objConfig.on).off(submenuID+'-'+objConfig.off);
                        // Ajout des nouveaux submenu
                        This.on(submenuID+'-'+objConfig.on, function(){
                            $GET('ADD').last(document.body, view);
                            var xy = positionUsingNode[pos](this.node, view, somme, this.e);
                            if (objConfig.fullscreen === true && /top|bottom/i.test(objConfig.position)) {
                                xy.x = 0; view.width('100%');
                                var w = view.width(), bdw = $GET('GET').style(view, 'border-width'), pd = $GET('GET').style(view, 'padding');
                                w -= (bdw.left+bdw.right); w -= (pd.left+pd.right); view.width(w+'px');
                            }
                            view.x(xy.x + 'px').y(xy.y + 'px');

                        });
                        if(objConfig.off !== false){
                            This.on(submenuID + '-' + objConfig.off, function () {
                                removeItemsEventFunc(view);
                                if(/mouseout|mouseleave/i.test(this.type)){
                                    if(this.related !== view.get()[0]){ view.remove() }
                                }else{
                                    view.remove()
                                }
                            })
                        }

                        return This
                    }
                 /*---------------------------------------------------------------*/

                var createBySelType = {
                    node: function (el, zkId) {
                        var nodes = (zkId === ZKID) ? el : el.get(), results = [];
                        each(nodes, function(){
                            results.push(this.v.cloneNode(true));
                        });
                        return results;
                    },
                    // getElementById ou createElement
                    nodeelement: function (el) { return createBySelType.node([el],ZKID) },
                    // getElementsByTagName ou getElementsByClassName ou ...
                    htmlcollection: function (el) { return createBySelType.node(toArray(el),ZKID) },
                    // querySelector et querySelectorAll
                    nodelist: function (el) { return createBySelType.node(toArray(el),ZKID) },
                    string: function (el) {
                        var node = document.createElement(el);
                        return node ? [node] : [] ;
                    }
                } ;
                This.create = function (sel, attrs) {
                    nodes = createBySelType[is(sel)](sel) || [];
                    if(is(attrs, 'string')){ attrs = {'html': attrs} }
                    if(is(attrs, 'object')){
                        each(nodes, function(){
                            var node = this.v;
                            each(attrs, function(){
                                if(this.k==='text'){
                                    node.textContent = this.v;
                                } else if(this.k==='html'){
                                    node.innerHTML = this.v;
                                } else {
                                    node.setAttribute(this.k, this.v);
                                }
                            });
                            return node;
                        });
                    }
                    return This
                } ;
                var selectByObj = {
                    node: function (el) { return el.get() },
                    // getElementById ou createElement
                    nodeelement: function (el) { return [el] },
                    // getElementsByTagName ou getElementsByClassName ou ...
                    htmlcollection: function (el) { return toArray(el) },
                    // querySelector et querySelectorAll
                    nodelist: function (el) { return toArray(el) },
                    array: function (el) {
                        var n = [];
                        each(el, function () {
                            var v = this.v, t = is(v);
                            if (selectByObj.hasOwnProperty(t) && t !== 'array') {
                                n = n.concat(selectByObj[t](v))
                            }
                        });
                        return n
                    },
                    string: function (el) {
                        var n = [], t;
                        try {
                            n = querySelectorAll($D, el), t = is(n);
                            if (selectByObj.hasOwnProperty(t)) {
                                n = selectByObj[t](n)
                            }
                        } finally {
                            return n
                        }
                    }
                } ;
                This.$ = function(sel){
                    var t = is(sel);
                    nodes = selectByObj.hasOwnProperty(t) ? selectByObj[t](sel) : [] ;
                    return This;
                }
                This.get = function (reg) {
                    if (reg === undefined) { return nodes }
                    var t = is(reg); nodes = [];
                    if(t === 'array'){ nodes = G.at(nodes, reg) }
                    if(t === 'number'){
                        nodes = (reg > -1) ? G.first(nodes, reg) : G.last(nodes, Math.abs(reg)) ;
                    }
                    if(t === 'string'){
                        var res = [] ;
                        reg = reg.toLowerCase();
                        each(nodes, function(){
                            if(this.v.nodeName.toLowerCase() === reg){
                                res.push(this.v);
                            }
                        });
                        nodes = res ;
                    }
                    return This;
                } ;
                This.add = function (val, isConcat) { return A.add(This, val, isConcat) };
                This.attr = function(att, val, isConcat){ return (val === undefined) ? G.attr(This, att) : A.attr(This, att, val, isConcat) };
                This.class = function (val, isConcat) { return (val === undefined) ? G.class(This) : A.class(This, val, isConcat) };
                This.id = function (val, isConcat) { return (val === undefined) ? G.id(This) : A.id(This, val, isConcat) };
                This.style = function (styleName, val) {
                    if(styleName === undefined){ return This }
                    return (val === undefined) ? G.style(This, styleName) : A.style(This, styleName, val)
                };
                var styles = ['color','margin', 'padding', 'border', 'width', 'height', 'x', 'y', 'background','cursor','position'] ;
                each(styles, function () {
                    var v = this.v;
                    This[v] = function (val) { return (val === undefined) ? G.style(This, v) : A.style(This, v, val) }
                });
                This.x = function (val) { return (val === undefined) ? G.x(This) : A.x(This, val) };
                This.y = function (val) { return (val === undefined) ? G.y(This) : A.y(This, val) };
                This.children = function () { return G.children(This) };
                This.parent = function () { return G.parent(This) };
                This.text = function (text, isConcat) { return (text === undefined) ? G.text(This) : A.text(This, text, isConcat) };
                This.html = function (html, isConcat) { return (html === undefined) ? G.html(This) : A.html(This, html, isConcat) };
                This.value = function (val, isConcat) { return (val === undefined) ? G.value(This) : A.value(This, val, isConcat) };
                This.val = function(val, isConcat){ return This.value(val, isConcat) };
                This.on = function(ev, func, args){ return $GET('EVENT').on(This, ev, func, args) };
                This.off = function(ev){ return $GET('EVENT').off(This, ev) };
                This.show = function(){ return This.style('display', 'block') };
                This.hide = function(){ return This.style('display', 'none') };
                var ctrlFormatFunc = {
                    date: function(){
                        This.on('focus',function(){
                            var node = $GET('NODE').$(this.node),
                                x = node.x()+ 5,
                                y = node.y()+node.getHeight2();
                            $GET('DATE').show(x+'px',y+'px',node, true);
                        })
                    },
                };
                var ctrlFormat = {
                    text: /.+/i,
                    url: /^(?:https?:\/\/|ftp:\/\/|gopher:\/\/|wais:\/\/|telnet:\/\/|mailto:|news:)[\d\w]+(?:[^ <>\d\w]?[\d\w]+)+$|^file:\/{2,3}[\w]+[:\|](?:[^ <>\d\w]?[\d\w]+)+$/i,
                    email: /^[\da-z]+(?:[\.\!\#\$\%\&\'\*\+\-\/\=\?\^\_\`\{\|\}\~]?[\da-z]+)+@[\da-z]+(?:[\.\!\#\$\%\&\'\*\+\-\/\=\?\^\_\`\{\|\}\~]?[\da-z]+)+\.[a-z]{2,4}$/i,
                    date: function(){ return $GET('CONFIG').dateReg() },
                    number: /^-?[\d]+$/,
                    tel: /^0[1-7](?:[ \/-][0-9]{2}){4}$/,
                    day: /^(?:0?[1-9]|1[0-9]|2[0-9]|3[01])$/,
                    month: /^(?:0?[1-9]|1[0-2])$/,
                    year: /^[1-9][0-9]{3,}$/
                };
                This.control = function(reg, event, func, args){
                    if(!ctrlFormat.hasOwnProperty(reg)){
                        if(!is(reg, "regexp")){ return This }
                        var r = "custom-"+(NODEID++);
                        ctrlFormat[r] = reg;
                        reg = r;
                    }
                    A.attr(This, "zk-control", reg);
                    if(ctrlFormatFunc.hasOwnProperty(reg)){ ctrlFormatFunc[reg]() }
                    $GET('EVENT').on(This, event, function(){
                        var node = this.node, reg = ctrlFormat[G.attr(node, "zk-control")],
                            name = node.nodeName.toLowerCase(),
                            val = (name == 'input' || name == 'textarea') ? node.value : node.textContent;
                        if(is(reg, 'function')){ reg = reg() }
                        this.state = reg.test(val);
                        func.apply(this, is(args, 'array')?args:[args]);
                    });
                    return This;
                };
                This.next = function(zkId){
                    var res = [];
                    each(nodes, function(){
                        var next = this.v[(zkId === ZKID)?'previousElementSibling':'nextElementSibling'];
                        if(next){ res.push(next) }
                    });
                    nodes = res;
                    return This;
                };
                This.previous = function(){ return This.next(ZKID) }

            }
            $SET('NODE', new NODE());

            // Service AJAX : multiple
            function AJAX() {
                var This = this, N = $GET('NODE'), lastRequest = null, view = null, method = 'get', format = 'text' ;
                var methods = { get: 1, post: 1, head: 1} ;
                function setMethod(val){
                    if(methods.hasOwnProperty(val)){ method = val }
                    return method
                }
                /*This.method = function(val){
                 if(methods.hasOwnProperty(val)){ method = val }
                 return method
                 } ;*/
                var formats = {
                    text: function (xhr) {
                        var r;
                        try { r = xhr.responseText } catch (err) { r = null }
                        return r;
                    },
                    xml: function (xhr) {
                        var r;
                        try { r = xhr.responseXML } catch (err) { r = null }
                        return r;
                    },
                    html: function (xhr) {
                        var r;
                        try {
                            r = xhr.responseXML
                        } catch (err) {
                            r = null
                        }
                        return r;
                    },
                    json: function (xhr) {
                        var r;
                        try { r = JSON.parse(xhr.responseText) } catch (err) { r = null }
                        return r;
                    },
                    array: function (xhr) { return formats.json(xhr) },
                } ;
                function setFormat(val){
                    if(formats.hasOwnProperty(val)){ format = val }
                    return format
                }
                /*This.format = function(val){
                 if(formats.hasOwnProperty(val)){ format = val }
                 return format
                 } ;*/
                /**
                 * Cette permet de faire une requête AJAX. Les arguments peuvent être indiqués dans le desordre.
                 *
                 * @param file {String}
                 *      Exemples : "test.php $method $format"   "$format test.php $method"
                 *          - $method : $get $post
                 *          - $format: $text $xml $html $json
                 *
                 * @param p {[Object]} : Type Object uniquement. Paramètres de la requête.
                 *
                 * @param f {[Function]} : Type Function uniquement. Fonction à exécuter après la réception de la réponse.
                 *      - this.response : Réponse du serveur. Elle vaut null si le format des données ne pas être obtenu.
                 *      - this.file : Fichier qui a été chargé
                 *      - this.method : Méthode utilisé
                 *      - this.format : Format des données qui ont récupérées
                 *      - this.param : Paramètres qui ont été passés à la requête
                 *      - this.func : La fonction elle même
                 *      - this.args : Arguments de la fonction
                 *      - this.view : Les éléments HTML qui vont recevoir la réponse
                 *      - this.ID : Identifiant de la requête. La dernière requête est stocké
                 *
                 * @param a {[Array]} : Type Array uniquement. Arguments de la fonction.
                 *
                 * @returns {AJAX}
                 */
                This.load = function (file, p, f, a) {
                    var param = {}, func = null, args = [], t ;
                    var ajustArgs = {
                        object: function (el) { param = el },
                        'function': function (el) { func = el },
                        array: function (el) { args = el },
                        string: function (el) { file = el },
                    };
                    t = is(p); if (ajustArgs.hasOwnProperty(t)) { ajustArgs[t](p) }
                    t = is(f); if (ajustArgs.hasOwnProperty(t)) { ajustArgs[t](f) }
                    t = is(a); if (ajustArgs.hasOwnProperty(t)) { ajustArgs[t](a) }
                    t = is(file); if (ajustArgs.hasOwnProperty(t)) { ajustArgs[t](file) }
                    file += '';
                    file = trim(file.replace(/\$[^ ]+/gi, function (str) {
                        str = str.slice(1).toLowerCase();
                        setMethod(str); setFormat(str);
                        return ''
                    }));
                    var xhr = new XMLHttpRequest(), a = '', get = (method === 'get') ? 1 : 0;
                    each(param, function () {
                        a += '&' + this.k + '=' + encodeURIComponent(this.v)
                    });
                    a = a.slice(1);

                    xhr.open(method, file + (get ? ('?' + a) : ''), true);
                    xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
                    if (!get) { xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded") }

                    xhr.onreadystatechange = function () {
                        if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 0)) {
                            var response = formats[format](xhr) ;
                            if (func) {
                                lastRequest = {
                                    response: response,
                                    file: file,
                                    method: method,
                                    format: format,
                                    param: param,
                                    func: func,
                                    args: args,
                                    view: view,
                                    ID: parseInt(Math.random() * 1000000)
                                };
                                var repFunc = func.apply(lastRequest, args);
                            }
                            if(view){
                                response = (repFunc === undefined) ? response : repFunc ;
                                view.add(response);
                            }
                        }
                    };
                    xhr.send(get ? null : a);
                    return This;
                };
                This.lastRequest = function () {
                    return lastRequest
                };
                /**
                 * Permet de définir les éléments qui contiendront la réponse
                 * @param el {mixed}
                 *      - el === undefined      => Retourne l'objet NODE contenant les éléments
                 *      - el === null           => Blocage de la vue
                 *      - autre                 => Recherche et définition de la vue
                 * @returns {*}
                 */
                This.view = function(el){
                    if(el === undefined){ return view }
                    view = N.$(el);
                    if(!view.get()[0]){ view = null }
                    return This
                };
            }
            //$SET('AJAX', new AJAX());

            // Service EVENT
            function EVENT() {
                var This = this, EF = {};
                var events = {/* "20315525-articles-click": [f1, f2, ...] */};
                var eventsAlias = {
                    out: 'mouseout',
                    over: 'mouseover',
                    down: 'mousedown',
                    up: 'mouseup',
                    enter: 'mouseenter',
                    leave: 'mouseleave',
                    move: 'mousemove',
                    kp: 'keypress',
                    kd: 'keydown',
                    ku: 'keyup'
                };
                //This.alias = function () { return eventsAlias };
                /**
                 * Elle ajuste le nom et l'événement
                 * @param ev {String}   => "articles - click",  "click"
                 * @returns {Array|*}
                 */
                function ajustEVentName(ev) {
                    ev = trim((ev + '').replace(/ /g, ''), " -").split(/\-/);
                    if (ev.length === 1) { ev = ['e' + ZKID].concat(ev) }
                    if (eventsAlias.hasOwnProperty(ev[1])) { ev[1] = eventsAlias[ev[1]] }
                    return ev;
                }

                /**
                 * Elle permet d'enregistrer des événements
                 * @param ev {String} : "20315525-articles-click"
                 * @param f {Function} : Fonction à enregistrer
                 * @returns {Array}
                 */
                function setEventsFunctions(ev, f) {
                    if (!events.hasOwnProperty(ev)) { events[ev] = [] }
                    return (events[ev].push(f))
                }
                function getEventsFunctions(ev) { return (events.hasOwnProperty(ev)) ? events[ev] : [] }
                function clearEventsFunctions(ev) { delete events[ev] }

                /**
                 * A utiliser avec la fonction addRemoveEvent. Règle les problèmes d'héritage
                 * @type {{mouseover: Function, mouseout: Function}}
                 */
                var isOverOrOut = {
                    mouseover: function (node, event, out) {
                        var rT = event.relatedTarget || event[out ? 'toElement' : 'fromElement'] || node;
                        if (is(rT, 'nodeelement')) {
                            while (rT && rT !== node) {
                                rT = rT.parentNode;
                            }
                            if (rT !== node) {
                                return true
                            }
                        }
                        return false
                    },
                    mouseout: function (node, event) { return isOverOrOut.mouseover(node, event, 1) }
                };

                /**
                 * Cette fonction permet d'ajouter ou de supprimer un événement
                 * @param node
                 * @param ev = Evénement à ajouter sans le 'on'
                 * @param func = Elle recoit l'objet this avec :
                 *          - this.node : L'élément sur lequel l'événement s'est produit
                 *          - this.type : Le type d'événement (click, mouseover...)
                 *          - this.e : L'objet Event
                 *          - this.related : Pour over et out
                 *          - this.code : Le code de la touche pressée
                 *          - this.char : La touche pressée
                 * @param args  = Arguments de la fonction sous forme de tableau
                 * @param rm  =>  void = add    ['removeEventListener','detachEvent'] = remove
                 */
                function addRemoveEvent(node, ev, func, args, rm) {
                    var isRm, idEv = setNodeId(node) + '-' + ev[0] + '-' + ev[1];
                    if (rm === ZKID) {
                        rm = ['removeEventListener', 'detachEvent'];
                        isRm = true
                    } else {
                        rm = ['addEventListener', 'attachEvent']
                    }
                    if (isRm) {
                        var fs = getEventsFunctions(idEv);
                        each(fs, function () {
                            if (node[rm[0]]) {
                                node[rm[0]](ev[1] + '', this.v, false)
                            }
                            else {
                                node[rm[1]]('on' + ev[1], this.v)
                            }
                        });
                        clearEventsFunctions(idEv);
                        return 1
                    }
                    function eventFunc(e) {
                        var dt = new Date();
                        e = e || window.event;
                        e.stopPropagation();
                        var obj = {
                            e: e,
                            node: this,
                            type: e.type,
                            //time: METH.get.format(dt,['%hh:%ii:%ss']),
                            //date: METH.get.format(dt,['%DD %dd %MM %yy']),
                            related: e.relatedTarget || e[(e.type === 'mouseout') ? 'toElement' : 'fromElement']
                        };
                        obj.code = undefined;
                        obj.char = undefined;
                        if (e.type === 'keypress' || e.type === 'keyup' || e.type === 'keydown') {
                            obj.code = e.keyCode || e.charCode;
                            obj.char = String.fromCharCode(obj.code);
                        }
                        if (isOverOrOut.hasOwnProperty(e.type)) {
                            if (isOverOrOut[e.type](this, e)) {
                                func.apply(obj, args)
                            }
                        }else {
                            func.apply(obj, args);
                        }
                    }
                    if (node[rm[0]]) {
                        node[rm[0]](ev[1] + '', eventFunc, false)
                    }
                    else {
                        node[rm[1]]('on' + ev[1], eventFunc)
                    }
                    setEventsFunctions(idEv, eventFunc);
                    return 1
                }

                var onByObj = {
                    // Renvoie un tableau
                    node: function (el, evs, func, args, zkId) {
                        if (!is(func, 'function')) { return [] }
                        if (!is(args, 'array')) { args = [args] }
                        var tabNodes;
                        if (zkId === ZKID) { tabNodes = el } else { tabNodes = el.get() }

                        evs = evs.split(",");

                        each(evs, function(){
                            var ev = ajustEVentName(this.v);
                            each(tabNodes, function () {
                                addRemoveEvent(this.v, ev, func, args)
                            });
                        });

                        return tabNodes;
                    },
                    // Renvoie un tableau
                    nodeelement: function (el, ev, func, args) { return onByObj.node([el], ev, func, args, ZKID) },
                    // Renvoie un tableau
                    nodelist: function (el, ev, func, args) { return onByObj.node(toArray(el), ev, func, args, ZKID) },
                    // Renvoie un tableau
                    htmlcollection: function (el, ev) { return onByObj.nodelist(el, ev) }
                };
                This.on = function (el, ev, func, args) {
                    var res = [];
                    if(ev){
                        var t = is(el);
                        if (onByObj.hasOwnProperty(t)) { res = onByObj[t](el, (""+ev), func, args) }
                    }

                    return $GET('NODE').$(res);
                };
                EF.on = function (ev, func, args) { return This.on(this, ev, func, args) };

                var offByObj = {
                    // Renvoie un tableau
                    node: function (el, ev, zkId) {
                        var ev = ajustEVentName(ev), tabNodes;
                        if (zkId === ZKID) { tabNodes = el } else { tabNodes = el.get() }
                        each(tabNodes, function () {
                            addRemoveEvent(this.v, ev, 0, 0, ZKID)
                        });
                        return tabNodes
                    },
                    // Renvoie un tableau
                    nodeelement: function (el, ev) { return offByObj.node([el], ev, ZKID) },
                    // Renvoie un tableau
                    nodelist: function (el, ev) { return offByObj.node(toArray(el), ev, ZKID) },
                    // Renvoie un tableau
                    htmlcollection: function (el, ev) { return offByObj.nodelist(el, ev) }

                };
                This.off = function (el, ev) {
                    var res = [], t = is(el);
                    if (offByObj.hasOwnProperty(t)) { res = offByObj[t](el, ev) }
                    return $GET('NODE').$(res)
                };
                EF.off = function (ev) { return This.off(this, ev) };

                var evs = ['click', 'down', 'move', 'over', 'enter', 'out', 'leave', 'up', 'keydown', 'keyup', 'keypress'];
                each(evs, function () {
                    var ev = this.v;
                    This[ev] = function (el, func, args) { return This.on(el, ev, func, args) };
                    EF[ev] = function (func, args) { return This[ev](this, func, args) };
                });

                //$GET('PROTO').objects([NODE, NodeList, HTMLElement, HTMLCollection]);
                setProto('EVENT', EF);
            }
            $SET('EVENT', new EVENT());


            freeze();

        }

        return new zk(window, document)


})();
