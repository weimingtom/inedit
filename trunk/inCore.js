/******
 * in Core New Wave Javascript
 * http://code.google.com/p/inedit/
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * $Author: achun (achun.shx at gmail.com)
 * $Create Date: 2008-10-30
 * $Revision: 8.10.30
 ******/
/**
 * 混入模式的对象成员覆盖式扩展,使用此模式后prototype属性将不再可靠
 */
function Log(o){
	if (window.console && window.console.log) {
		if (typeof o=='object') window.console.dir(o);
		else window.console.log(o);
	}
}

function inMixin(){
	var ths=this,i=0;
	if (ths==window){
		ths=arguments[0];i=1;
	}
	if(ths==null) throw "this is undefined";
	if(i==arguments.length){
		ths.mixin=inMixin;
		return ths;
	}
	for (;i<arguments.length ;i++){
		for (var a in arguments[i]){
			ths[a]=arguments[i][a];
		}
	}
	return ths;
}
/**
 *国际化翻译
 *设置语言和翻译文本为一体的调用
 */
function inI18N (txt,lang){
	var s=txt.toLowerCase();
	if(typeof lang=='object'){
		if (!this['i18n.'+s]) this['i18n.'+s]={};
		inMixin(this['i18n.'+s],lang);
		return;
	}
	if(!this.lang) this.lang=(navigator.userLanguage||navigator.language).toLowerCase();
	lang='i18n.'+(lang?lang:this.lang).toLowerCase();
	var t=this[lang];
	if (!t) return txt;
	if (typeof t=='function')
		return t(txt);
	if(!t[s]){
		if(!this[lang+'.unknown'])
			this[lang+'.unknown']={};
		this[lang+'.unknown'][s]='';
		return txt;
	}
	return t[s];
};

/**
 *基于对象的Core操作
 */
var inCore={
	mixin:inMixin,
	isinCore:'8',
	/*浏览器识别*/
	browser:(function(){
			var ua=navigator.userAgent.toLowerCase();
			var is=(ua.match(/\b(chrome|opera|safari|msie|firefox)\b/) || ['','mozilla'])[1];
			var r='(?:'+is+'|version)[\\/: ]([\\d.]+)';
			var v=(ua.match(new RegExp(r)) ||[])[1];
			return {is:is,ver:v};
	})(),/*转换到驼峰格式*/
	camelize : function(s) {
		return s.replace(/\-(.)/g, function(m, l){return l.toUpperCase()});
	},
	trim:function(text){
		return (text || "").replace( /^\s+|\s+$/g, "" );
	},/*fetch obj的部分成员*/
	fetch:function(obj,members){
		var ret={};
		if (typeof members=='string')
			members=members.split(',');
		var isarray=members instanceof Array;
		this.each(members,function(v,k){
			if (isarray)
				ret[v]=obj[v];
			else
				ret[k]=obj[k];;
		});
		return ret;
	},/*Object To Array*/
	toArray:function(obj){
		if(!obj) obj=this;
		var ret=[];
		this.each(obj,function(v){
			ret.push(v);
		},true);
		return ret;
	},
	/*遍历对象,回调fun的参数:(v,k,['first','even','odd','lasteven','lastodd'])*/
	each:function(obj,fun,bylength){
		if(typeof fun!='function' && typeof obj=='function'){
			var fn=obj,a=this,bylength=fun;
		}else{
			var fn=fun,a=obj;
		}
		var ret=0,odd=false;
		if(a instanceof Array)
			for (var i=0;i<a.length;i++){
				odd=!odd;
				var even=odd?'even':'odd';
				var at=i==0?'first':i==a.length-1?'last'+even:even;
				if(false===fn.call(this,a[i],i,at)) break;
			}
		else if (typeof a == 'object')
			if(bylength)
				for (var i=0;i<a.length;i++){
					odd=!odd;
					var even=odd?'even':'odd';
					var at=i==0?'first':i==a.length-1?'last'+even:even;
					if(false===fn.call(this,a[i],i,at)) break;
				}
			else{
				var index=-1,j=0;
				for (var i in a) index++;
				for (var i in a){
					odd=!odd;
					var even=odd?'even':'odd';
					var at=i==0?'first':j==index?'last'+even:even;
					j++;
					if(false===fn.call(this,a[i],i,at)) break;
				}
			}
		else if (typeof a == 'function' && a.len)
			for (var i=0;i<a.len;i++){
				odd=!odd;
				var even=odd?'even':'odd';
				var at=i==0?'first':i==a.len-1?'last'+even:even;
				if(false===fn.call(this,a['0'+i],i,at)) break;
			}
		return this;
	},/*递归的遍历node的所有子节点*/
	walkNode:function(node,fun,nodeType){
		nodeType=nodeType||1;
		var ret,n=node.firstChild;
		while(n){
			if(n.nodeType==nodeType)
				ret=fun.call(this,n);
			if(true===ret) return true;//彻底中断walk
			if(false!==ret)//是否允许递归子节点
				if(true===this.walkNode(n,fun,nodeType)) break;//彻底中断walk
			n=n.nextSibling;
		}
		return this;
	},/*向上追溯,符合要求的node,默认是nodeType==1的节点*/
	traceNode:function(node,fun){
		if(!fun)
			if (!node || node.nodeType==1)
				return node;
			else
				return node.parentNode;
		var n=node;
		while(n){
			if(false===fun.call(this,n)) break;
			n=n.parentNode;
		}
		return this;
	},
	/*设置节点的样式*/
	setStyle : function(nodes,st) {
		if (!nodes || (typeof st!='object')) return this;
		var ns=nodes;
		if(ns.nodeType) var ns=[nodes];
		for (var i=0;i<ns.length ;i++ ) {
			if (ns[i].nodeType!=1) continue;
			var style = ns[i].style;
			for(var itm in st){
				var key=this.camelize(itm);
				if (',float,opacity,'.indexOf(','+itm+',')!=-1) {
					switch (itm) {
					case 'opacity':
						if (this.browser.is=='msie')
							style.filter = 'alpha(opacity=' + Math.round(st[itm]*100) + ')';
						else
							style.opacity = st[itm];
						break;
					case 'float':
						style['cssFloat'] = style['styleFloat'] = st[itm];
						break;
					}
					continue;
				}
				style[key] = st[itm];
			}
		}
		return this;
	},/*获取/设置节点的属性*/
	Attr: function(node,attrs) {
		if (!node.nodeType || !attrs) return this;
		if(typeof attrs=='string')
			if(attrs.indexOf(',')==-1)
				return (attrs===attrs.toLowerCase())?node.getAttribute(attrs):node[attrs];
			else
				attrs=attrs.split(',');
		if (attrs instanceof Array){
			var ret={};
			for (var i=0;i<attrs.length ;i++ )
				ret[attrs[i]]=(attrs[i]===attrs[i].toLowerCase())?node.getAttribute(attrs[i]):node[attrs[i]];
			return ret;
		}
		for (var a in attrs){
			if (a=='tagName') continue;
			if (a===a.toLowerCase())
				node.setAttribute(a,attrs[a]);
			else
				node[a]=attrs[a];
		}
		return this;
	},/*便捷的建立Element*/
	E:function(attrs,styles,node){
		if (typeof attrs=='string')
			var tn=attrs,attr;
		else
			var tn=attrs.tagName,attr=attrs;
		if (styles && styles.nodeType)
			var n=styles,st;
		else
			var n=node,st=styles;
		var e=document.createElement(tn);
		this.Attr(e,attr).setStyle(e,st);
		if (n){
			n.appendChild(e);
			return this;
		}
		return e;
	}
}

/**
 *队列/命令/事件instance/修正浏览器见事件属性的兼容性
 *
 *对于指令队列模式支持 根据type的值判断
 * Bubble  :冒泡,  返回值作为是否结束冒泡的条件,false==结束冒泡
 * Chain   :链式,  返回值作为下一个的 this 对象
 * Relay   :值接力,返回值作为下一个的 参数
 * Offset  :偏移,  返回值作为以当前函数为0坐标的先前向后跳转执行的步长
 * FireOnce:触发后就删除队列
 * 
 *对于事件队列模式支持 根据第一个附加参数的值判断
 * removeFun  :只触发一次的事件函数,触发后从队列里删除函数
 * removeEvent:只触发一次的事件,触发后从队列里删除事件
 * removeQueue:只触发一次的事件,触发后删除所有的队列
 * 
 *对于事件队列模式支持 根据 cancelBubble 和返回值判断
 * return ====false:设置cancelBubble=true
 * return ====false && cancelBubble===true:结束队列
 *
 */
var inQueue={
	isinQueue:'8',
	/*findQueue*/
	findQueue:function(domain,type,index){
		if (!this.Queues) this.Queues=[];
		for (var i=0;i<this.Queues.length ; i++) {
			if (this.Queues[i].domain===domain){
				if(!type) return i;
				for (var j in this.Queues[i].type ){
					if(j!==type) continue;
					if(index) return i;
					return this.Queues[i].type[type];
				}
			}
		}
		return null;
	},/*添加单个队列可以附加最多5个参数*/
	addQueue:function(withthis,domain,fn,type){
		if (typeof fn!='function') return false;
		function genEventFun(ths){
			return function(e){
				return ths.fireQueue(withthis,domain,type,e);
			}
		}
		if(this.autoRemoveQueue===true){
			this.autoRemoveQueue='set';
			var q=this.findQueue(window,'beforeunload');
			if (!q)
				var q=this.findQueue(window);
			if (null===q){
				var q={domain:window,type:{beforeunload:(function(ths){return function(e){
					return ths.fireQueue(ths,window,'beforeunload',e);
				}})(this)}};
				this.Queues.push(q);
			}else{
				q=this.Queues[q];
				if (!q.type) q.type={};
			}
			q.type.beforeunload['00']={fun:function(){},args:['removeQueue']};
			q.type.beforeunload.len=1;
			(window.addEventListener)
				?window.addEventListener('beforeunload',q.type.beforeunload,false)
				:window.attachEvent('onbeforeunload', q.type.beforeunload);
		}
		var ef=this.findQueue(domain,type);
		if (null===ef){
			var q=this.findQueue(domain);
			if (null===q){
				q={domain:domain,type:{}};
				this.Queues.push(q);
			}else{
				q=this.Queues[q];
				if (!q.type) q.type={};
			}
			q.type[type]=genEventFun(this);
			q.type[type].len=0;
			if(domain.addEventListener)
				domain.addEventListener(type,q.type[type],false);
			else if(domain.attachEvent)
				domain.attachEvent("on"+type, q.type[type]);
			ef=q.type[type];
		}
		ef['0'+(ef.len++)]={fun:fn,args:[].splice.call(arguments,4,arguments.length)};
		return this;
	},/*删除一个或全部队列,也可以在window unload 中设置这调用*/
	removeQueue:function (domain,type){
		if (0==arguments.length) {
			if (!this.Queues) this.Queues=[];
			for (var i=0;i<this.Queues.length ; i++) {
				var q=this.Queues[i];
				for (var j in q.type ){
					if(q.domain.removeEventListener)
						q.domain.removeEventListener(j,q.type[j] , false);
					else if(q.domain.detachEvent)
						q.domain.detachEvent("on" + j,q.type[j]);
				}
			}
			this.Queues=[];
			return this;
		}
		var i=this.findQueue(domain);
		if(null===i) return this;
		var q=this.Queues[i],cnt=0;
		for (var j in q.type ){
			cnt++;
			if(undefined!==type && j!==type) continue;
			cnt--;
			if(q.domain.removeEventListener)
				q.domain.removeEventListener(j,q.type[j] , false);
			else if(q.domain.detachEvent)
				q.domain.detachEvent("on" + j,q.type[j]);
			delete q.type[j];
		}
		if(undefined===type || cnt===0)
			this.Queues=this.Queues.splice(0,i).concat(this.Queues.splice(i+1));
		return this;
	},/*触发/传递Event事件*/
	fireQueue:function(withthis,domain,type,e){
		/*队列:支持系统事件队列和自定义指令队列
		 */
		var isEvent=(e && e.type===type);
		if (isEvent){//兼容性处理
			if(!e.target && e.srcElement) e.target = e.srcElement;
			if (undefined==e.charCode) 
				e.charCode=e.keyCode;
			else
				e.keyCode=e.charCode;
			if (e.target)
			if (undefined==e.layerX){
				e.layerX=e.offsetX+e.target.offsetLeft;
				e.layerY=e.offsetX+e.target.offsetTop;
			}else{
				e.offsetX=e.layerX-e.target.offsetLeft;
				e.offsetY=e.layerY-e.target.offsetTop;
			}
		}
		var fns=this.findQueue(domain,type);
		var re=false;
		var args=[e].concat([].splice.call(arguments,4,arguments.length));
		var ret=type=='Array'?[]:null,step=1,re,removeEvent=false,removeQueue=false;
		var cancelBubble=false;
		for (var i=0;i<fns.len ;i=i+step) {
			var fn=fns['0'+i];
			if(!fn) continue;
			var arg=args.concat(fn.args);
			re=fn.fun.apply(withthis,arg);
			if(isEvent){
				if(false===re && true===e.cancelBubble) break;//结束冒泡的条件并且结束队列
				if(false===re) cancelBubble=true;//对于DOM事件结束冒泡的条件
				switch(fn.args[0]){
				case 'removeFun':fn=null;break;
				case 'removeEvent':removeEvent=true;break;
				case 'removeQueue':removeQueue=true;break;
				}
				if(0===re) break;//结束冒泡并结束同级的函数处理
			}else{
				if('Bubble'==type && !re) break;//冒泡结束条件
				switch (type) {
				case 'Chain':withthis=re;break;//链式改变 this 
				case 'Relay'://值接力
					args=[e].concat([].splice.call(arguments,4,arguments.length));
					if (re instanceof Array)
						args.concat(re);
					else
						args.push(re);
					break;
				case 'Offset':step=parseInt(re)||0;break;//跳转/步长
				case 'Array':ret.push(re);
				}
				continue;
			}
		}
		if(isEvent){
			if(cancelBubble) e.cancelBubble=true;
			if(removeEvent) this.removeQueue(domain,type);
			if(removeQueue) {this.removeQueue();}
		}else{
			if(type==='FireOnce') this.removeQueue(domain,type);
		}
		if (type==='Array') return ret;
		return this;
	},/*为对象自己增加this域命令队列*/
	addCmd:function(cmd,fn){
		if (typeof cmd==='string'){/*支持fn数组*/
			var funs=typeof fn=='function'?[fn]:fn;
			var args=[].splice.call(arguments,2,arguments.length);
			for (var i=0;i<funs.length ;i++ ) 
				this.addQueue.apply(this,[this,'this',funs[i],cmd].concat(args));
		}else{/*简单设定多个队列*/
			var args=[].splice.call(arguments,1,arguments.length);
			for (var k in cmd)
				this.addQueue.apply(this,[this,'this',cmd[k],k].concat(args));
		}
		return this;
	},/*触发一个队列命令,如果附加了参数那么会覆盖 addCmd 中的附加参数*/
	fireCmd:function(cmd){
		var args=[this,'this',cmd].concat([].splice.call(arguments,1,arguments.length));
		return this.fireQueue.apply(this,args);
	},/*添加 DOMElement 事件*/
	addEvent:function(withthis,elem,type,fn){
		if (typeof type==='string'){/*支持多 Element 绑定一个fun*/
			var elems=elem.nodeType?[elem]:elem;
			var args=[].splice.call(arguments,4,arguments.length);
			for (var i=0;i<elems.length ;i++ )
				this.addQueue.apply(this,[withthis,elems[i],fn,type].concat(args));
		}else{/*一个 Element 绑定多个type和fun*/
			var args=[].splice.call(arguments,3,arguments.length);
			for (var k in type)
				this.addQueue.apply(this,[withthis,elem,type[k],k].concat(args));
		}
		return this;
	},/*模拟或者转发某一个 DOMElement 的事件,如果附加了参数那么会覆盖 addEvent 中的附加参数*/
	fireEvent:function(withthis,e,elem){
		if(withthis && withthis.cancelBubble!=undefined)
			var args=[null,e,withthis.type,withthis],i=2;
		else
			var args=[withthis,elem,e.type,e],i=3;
		args.concat([].splice.call(arguments,i,arguments.length));
		this.Queue.fire.apply(this,args);
		return this;
	}
};

/*DOMNode集合
 *对 DOMElement 操作的基础
 *返回一个空的inNode实例对象,
 *inNode实例对象和inNode对象的区别是inNode对象是function,inNode实例是{}
 *输入参数
 *  nodeType:可以是字符串形式的不同nodeType组合,比如'1,3',默认1
 *注意:必须实例化后才能用
	元素1  	ELEMENT_NODE
	属性2 	ATTRIBUTE_NODE
	文本3 	TEXT_NODE
	4 	CDATA_SECTION_NODE
	5 	ENTITY_REFERENCE_NODE
	6 	ENTITY_NODE
	7 	PROCESSING_INSTRUCTION_NODE
	注释8 	COMMENT_NODE
	文档9 	DOCUMENT_NODE
	10 	DOCUMENT_TYPE_NODE
	11 	DOCUMENT_FRAGMENT_NODE
	12 	NOTATION_NODE
 */