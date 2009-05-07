/******
 * inEdit 是 inline 式(不用iframe)的 WYSIWYG WEB 编辑器
 * http://code.google.com/p/inedit/
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * inEdit 认为一个页面上只需要一个 WEB 编辑器控制对象
 * 因此对 inEdit 对象来说不需要实例化,直接操作就行了
 * $Author: achun (achun.shx at gmail.com)
 * $Create Date: 2008-10-30
 * $Revision: 2009-05-07
 ******/

/**
 *可能要通过inEdit.mixin进行混入扩展的参数(并不局限)
 *参数:
 * transparentGif:string 需要配置一个1像素的透明 gif 文件路径
 * buttonList:object     配置面板中的按钮出现的次序
 * iconsPath:string      inEdit的图标集合文件路径,注意要求第一个图标预留给分割线
 * iconList:array        定义inEdit的图标集合和buttonList的位置关系
 * iconSize:inter        每一个图标的尺寸,默认18
 * onSave:function       当要保存某个可编辑 Element 时调用,传入的参数是 Element
 * onSaveAll:function    当要保存全部可编辑 Elements 时调用,传入的参数是 [Elements]
 * onUploadFile:function 上传文件按钮的支持这个具体实现不好说,跟应用有关
 *注:
 *autoRemoveQueue属性是通知 inQueue 在window unload 时释放所有的监听事件
 **/
var inEdit=inMixin({autoRemoveQueue:true},inCore,inQueue,{
	isinEdit:'9',
	mixin:inMixin,
	__:inI18N,
	/*设置面板*/
	setPanel:function(elem){
		if(this.panel)
			this.removeQueue(this.panel);
		else
			this.addEvent(this,document,'click',this.onDisable);
		var panel=document.createElement('DIV');
		var isie6=this.browser.is=='msie' && this.browser.ver<'7';
		for (var i=0;i<this.buttonList.length ;i++ ) {
			var bn=this.buttons[this.buttonList[i]]||'';
			/*分割线*/
			if(!bn){
				var bt=document.createElement('IMG');
				bt.src=this.transparentGif;
				st={
					'background-image':'url('+this.iconsPath+')',
					'margin-bottom':'4px',
					'opacity':1,
					'width':'9px',
					'height':this.iconSize+'px',
					'background-color':'transparent'
				};
			}else{
				bn.name=this.buttonList[i];
				var icon=this.iconList[this.buttonList[i]];
				var index=panel.childNodes.length;
				var st={};
				if(icon){
					var bt=document.createElement('IMG');
					bt.src=this.transparentGif;
					bt.setAttribute('title',this.__(bn.text));
					var w=icon*this.iconSize;
					st={
						'background-image':'url('+this.iconsPath+')',
						'background-position':'-'+w+'px 0',
						'cursor':'pointer',
						'margin-bottom':'4px',
						'margin-left':'2px',
						'margin-right':'2px',
						'opacity':isie6?1:0.5,
						'width':(bn.width||this.iconSize)+'px',
						'height':this.iconSize+'px',
						'background-color':'transparent'
					};
				}else{
					var bt=document.createElement('SPAN');
					bt.innerHTML=this.tagWrap(this.__(bn.text));
					st={
						'font-size':'15px',
						'line-height':'18px',
						'vertical-align':'top',
						'white-space':'nowrap',
						'cursor':'pointer',
						'opacity':isie6?1:0.5,
						'padding-left':'4px',
						'padding-right':'4px',
						'margin-bottom':'4px',
						'margin-left':'4px',
						'margin-right':'4px',
						'border':'#CCCCCC solid 1px',
						'background-color':'#FFFFFF'
					};
				}
				bt.inEditButton=bn;
			}
			this.Style(bt,st);
			panel.appendChild(bt);
		}
		this.addEvent(this,panel,'click',this.onClickPanel);
		this.Style(panel,{
			'background-color':'#EFEFEF',
			'padding-top':'4px',
			'border':'#CCCCCC solid 1px',
			'position':'relative'
		});
		this.enable=false;
		elem.appendChild(panel);
		this.panel=panel;
		var box=document.createElement('DIV');
		this.Style(box,{
			'background-color':'#EFEFEF',
			'padding':'4px',
			'border':'#CCCCCC solid 1px',
			'position':'absolute',
			'left':'0px',
			'display':'none'
		});
		panel.appendChild(box);
		this.modalPanel=box;
		return this;
	},/*删除Panel面板*/
	removePanel:function(){
		if(!this.panel) return;
		this.removeQueue(this.panel);
		this.panel.parentNode.removeChild(this.panel);
	},/*设置面板是否接受操作*/
	onDisable:function(e){
		var from='';
		if(e && e.target){
			for(var i=0;i<this.Instances.length;i++)
				if(e.target===this.Instances[i]){
					from=e.target.contentEditable!='true'?'instanceText':'instance';
					break;
				}
			if(!from) this.traceNode(e.target,function(n){
				if('true'==n.contentEditable ){
					from='instance';
					return false;
				}
				if(n==this.panel){
					from='panel';
					return false;
				}
			});
		}
		var same=this.enable;
		if(!from) {
			this.enable=false;
			this.modalBox();
		}else if ('panel'!=from)
			this.enable=true;
		same=same==this.enable;
		if (same) return;
		/*IE 6 闪烁的厉害,opacity就算了吧*/
		var st={cursor:this.enable?'pointer':'not-allowed'};
		if (!(this.browser.is=='msie' && this.browser.ver<'7'))
			st.opacity=this.enable?1:0.5;
		this.walkNode(this.panel,function(node){
			if (node.inEditButton)
				//(from=='instance' || (from=='instanceText' && (node.inEditButton.command=='save' || node.inEditButton.command=='saveAll'))))
					this.Style(node,st);
			return false;
		});
	},/*面板发生了 chick */
	onClickPanel:function(e){
		if(!e || !e.target) {return;}
		var elem=e.target;
		var bt;
		this.traceNode(elem,function(n){
			if (n==this.panel || n==this.modalPanel) return false;
			if (n.inEditButton){
				bt=n.inEditButton;
				return false;
			}
		});
		if(!bt) {return;}
		var xy=this.fetch(e,'clientX,clientY,layerX,layerY');
		var args=[inMixin(xy,bt)].concat(Array.prototype.slice.call(arguments,1));
		this.onClickPanelButton.apply(this,args);
	},/*处理触发命令*/
	onClickPanelButton:function(bt,arg){
		if(this.modalPanel.style.display=='none')
			this.getSelect();
		if (!bt.keepmodalBox) this.modalBox();
		if(!this.enable) return;
		if(typeof this[bt.command]=='function')
			this[bt.command].apply(this,Array.prototype.slice.call(arguments,0));
		else{
			this.execCommand(bt.command,arg||bt.arg);
		}
	},/*向 inEdit 增加可编辑 Elements*/
	addInstance:function(elems){
		if (!this.Instances) this.Instances=[];
		if(elems.nodeType==1) var ins=[elems];
		else var ins=elems;
		for (var i=0;i<ins.length ;i++ ){
			if(ins[i].nodeType!=1 || ins[i].contentEditable=='true') continue;
			ins[i].inEditSaveStyle={
				border:ins[i].style.border,
				padding:ins[i].style.padding
			};
			/*fix browser bug*/
			switch (this.browser.is) {
			case 'msie':
				if (ins[i]==ins[i].parentNode.lastChild)
					ins[i].parentNode.appendChild(document.createElement('DIV'));
				break;
			case 'firefox':
				break;
			}
			if(ins[i].nodeName=='DIV'){
				this.Style(ins[i],{border:'2px solid #F1CA7F',padding:"10px 0"});
				ins[i].contentEditable='true';
				this.addEvent(this,ins[i],'click',this.insSelect);
			}else{
				this.Style(ins[i],{border:'1px solid #F1CA7F'});
				this.addEvent(this,ins[i],'click',this.text);
			}
			this.Instances.push(ins[i]);
		}
	},/*纯文本修改*/
	text:function(e){
		this.insActive=this.insTarget=e.target;
		var src=this.insActive.textContent || this.insActive.innerText;
		var str=prompt('请输入文本',src);
		if(str!=null) src==this.insActive.innerText?this.insActive.innerTextr=str:this.insActive.textContent=str;
	},/*结束所有的可编辑 Elements ,并去除面板*/
	remove:function(){
		this.removeQueue();
		this.Instances=[];
		return this;
	},/*结束某个或所有可编辑 Elements*/
	removeInstance:function(domainss){
		var domains=domainss||[undefined];
		if(domains && domains.nodeType) domains=[domainss];
		for(var j=0;j<domains.length;j++){
			var domain=domains[j];
			this.each(this.Queues,function(q){
				if (undefined==domain || domain===q.domain){
					this.removeQueue(q.domain);//删除事件
					q.domain.contentEditable="inherit";
					this.Style(q.domain,q.domain.inEditSaveStyle);
					q.domain.inEditSaveStyle=null;
					if(domain) return false;
				}
			});
			if (undefined==domain) this.Instances=[];
			else for (var i=0;this.Instances && i<this.Instances.length ;i++ ) {
				if (this.Instances[i]===domain) {
					this.Instances.splice(i,1);
					break;
				}
			}
		}
		if(!this.Instances || !this.Instances.length) this.removePanel();
		return this;
	},/*关闭当前激活的编辑*/
	closeinsActive:function(){
		this.removeInstance(this.insActive);
		this.onDisable();
	},/*设定被选中的可编辑 Element*/
	insSelect:function(e){
		this.modalBox();
		this.insTarget=e.target;
		this.insActive=this.insTarget;
		while(!this.insActive.inEditSaveStyle){
			this.insActive=this.insActive.parentNode;
		}
	},/*弹出modal box*/
	modalBox:function(bt){
		if (!arguments.length)
			return this.Style(this.modalPanel,{display:'none'});
		if (bt===false || bt.command==='modalBox'){
			this.Style(this.modalPanel,{display:'none'});
			this.modalPanel.innerHTML='';
			return this;
		}
		if (bt===true)
			return this.Style(this.modalPanel,{display:''});
		this.Style(this.modalPanel,{display:'block'});
		var w=this.modalPanel.clientWidth,h=this.modalPanel.clientHeight;
		var top=Math.ceil(bt.layerY/(this.iconSize+8))*(this.iconSize+8)-4;
		var left=bt.layerX-Math.floor(w/2);
		if (left<10) left=10;
		if(left+w>=document.body.clientWidth) left=Math.floor((document.body.clientWidth-w)/2);
		if (left<0) left=0;
		this.Style(this.modalPanel,{top:top+'px',left:left+'px'});
	},/*用modal 显示一段信息*/
	modalMsg:function(bt,txt){
		this.modalBox(false);
		var b=document.createElement('div');
		b.inEditButton={command:'modalBox'};
		b.innerHTML=this.__(txt);
		this.Style(b,{cursor:'pointer'});
		this.modalPanel.appendChild(b);
		this.modalBox(bt);
	},/*执行 document.execCommand*/
	execCommand:function(cmd,arg){
		if (!this.Selection || !this.Range) return;
		var removefirstChild=false;
		if(this.browser.is=='firefox' || this.browser.is=='mozilla') {
			this.E({tagName:'P',_moz_dirty:''},{display:'block',height:'0px',margin:0,padding:0},this.insActive,this.insActive.firstChild);
			removefirstChild=true;
			this.Selection.removeAllRanges();
			this.Selection.addRange(this.Range);
		}else{
			this.Range.select();
		}
		document.execCommand(cmd,false,arg);
		if (removefirstChild) this.insActive.removeChild(this.insActive.firstChild);
	},/*用一个标签代码包裹htmlcode代码,为了方便程序*/
	tagWrap:function(htmlcode,tag){
		switch (tag) {
		case 'div':
			return '<div style="margin:4px 0;">'+htmlcode+'</div>';
		default:
			return '<span style="cursor:pointer">'+htmlcode+'</span>';
		}
	},/*获取select文字的信息*/
	getSelect:function(){
		this.Selection=(window.getSelection) ? window.getSelection() : document.selection;
		this.Range=this.Selection?(this.Selection.rangeCount > 0) ? this.Selection.getRangeAt(0) : this.Selection.createRange():null;
		this.RangeText=(undefined!=this.Range.text)?this.Range.text:this.Range.toString?this.Range.toString():'';
	}
});
/*国际化多语言支持*/
inEdit.__('zh-cn',{
	'bold':'加黑',
	'italic':'倾斜',
	'underline':'下划线',
	'left align':'左对齐',
	'center align':'中间对齐',
	'right align':'右对齐',
	'justify align':'两端对齐',
	'ordered list':'有序列表',
	'unordered list':'无序列表',
	'removeformat':'清除样式标签',
	'subscript':'下标',
	'superscript':'上标',
	'indent':'增加缩进量',
	'outdent':'减少缩进量',
	'strike through':'删除线',
	'horizontal rule':'用水平线替换选定文本',
	'font size...':'字大小',
	'font family...':'字体',
	'formatblock':'格式标签',
	'headings':'大标题',
	'forecolor':'文字颜色',
	'backcolor':'背景颜色',
	'edit image':'图片',
	'edit html':'编辑源代码',
	'edit link':'增改链接',
	'remove link':'断开链接',
	'file explore':'文件管理器',
	'submit':'提交',
	'align':'对齐',
	'alt text':'替代文字',
	'image src':'图片网址',
	'url':'地址',
	'title':'提示',
	'open in':'打开',
	'current window':'在当前窗口',
	'new window':'在新开窗口',
	'paragraph':'标准段落',
	'pre':'格式化文本',
	'save':'保存',
	'saveall':'全部保存',
	'close instance actived':'关闭此编辑',
	'undo':'撤消',
	'redo':'重做',
	'plase select image or text before':'<b style="color:red">请先选择一个图片或选择一段文本</b>',
	'plase select link title or click image before':'<b style="color:red">请先选择一段链接文本或点击一个图片</b>',
	'plase select text before under msie':'<b style="color:red">请先选择一段被替换掉的文字</b>'
});
/*配置*/
inEdit.mixin({
	transparentGif:'/style/imgs/pixel.gif',
	iconsPath : '/style/imgs/nicEditorIconsfull.gif',
	buttonList : [
		'closeinsActive','save','saveall','undo','redo','|',
		'bold','italic','underline','strikethrough','subscript','superscript',
		'fontfamily','fontsize',
		'fgcolor','bgcolor','removeformat','|',
		'left','center','right','justify',
		'indent','outdent','|',
		'link','unlink',
		'image','hr','|',
		'ol','ul','paragraph','headings'
		],
	iconList:{'xhtml':1,'bgcolor':2,'fgcolor':3,'bold':4,'center':5,'hr':6,'indent':7,'italic':8,'justify':9,'left':10,'ol':11,'outdent':12,'right':13,'save':14,'strikethrough':15,'subscript':16,'superscript':17,'ul':18,'underline':19,'image':20,'link':21,'unlink':22,'closeinsActive':34,'removeformat':24,'arrow':25,'undo':26,'redo':27,'saveall':29,'paragraph':30,'fontfamily':31,'fontsize':32,'headings':33},
	iconSize:18,
	buttons : {
		'closeinsActive' : {text : 'close Instance Actived', command : 'closeinsActive'},
		'save' : {text : 'save', command : 'save'},
		'saveall' : {text : 'saveall', command : 'saveAll'},
		'bold' : {text : 'Bold', command : 'bold'},
		'italic' : {text : 'Italic', command : 'italic'},
		'underline' : {text : 'Underline', command : 'underline'},
		'left' : {text : 'Left Align', command : 'justifyleft'},
		'center' : {text : 'Center Align', command : 'justifycenter'},
		'right' : {text : 'Right Align', command : 'justifyright'},
		'justify' : {text : 'Justify Align', command : 'justifyfull'},
		'ol' : {text : 'Ordered List', command : 'insertorderedlist'},
		'ul' : {text : 'Unordered List', command : 'insertunorderedlist'},
		'subscript' : {text : 'Subscript', command : 'subscript'},
		'superscript' : {text : 'Superscript', command : 'superscript'},
		'strikethrough' : {text : 'Strike Through', command : 'strikethrough'},
		'indent' : {text : 'Indent', command : 'indent'},
		'outdent' : {text : 'Outdent', command : 'outdent'},
		'hr' : {text : 'Horizontal Rule', command : 'oninserthorizontalrule'},
		'removeformat' : {text : 'RemoveFormat', command : 'removeformat'},
		'undo' : {text : 'Undo', command : 'undo'},
		'redo' : {text : 'Redo', command : 'redo'},
		'unlink':{text : 'remove link', command : 'unlink'},
		/*pop box*/
		'link':{text : 'edit link', command : 'onlink'},
		'fontsize' :{text : 'font size...', command : 'onfontsize'},
		'fontfamily' :{text : 'font family...', command : 'onfontfamily'},
		'paragraph' :{text : 'paragraph', command : 'formatblock',arg:'<P>'},//???
		'headings' :{text : 'headings', command : 'onheadings'},
		'bgcolor' :{text : 'backcolor', command : 'oncolor',arg:'backcolor'},
		'fgcolor' :{text : 'forecolor', command : 'oncolor',arg:'forecolor'},
		'image' :{text : 'edit image', command : 'onimage'}
	}
});

/*下面是需要特殊处理的编辑命令,也就是不能直接用document.execCommand发送的命令*/
inEdit.mixin({
	removeformat:function(cmd){
		if('firefox,mozilla'.indexOf(this.browser.is)!=-1 && this.insTarget!=this.insActive){
			if(this.insTarget.nodeType==1)
				this.insTarget.style.cssText='';
			else if(this.insTarget.parentNode!=this.insActive)
				this.insTarget.parentNode.style.cssText='';
		}
		this.execCommand('removeformat');
	},
	oninserthorizontalrule:function(bt){
		if(this.browser.is=='msie' && ''==this.RangeText)
			return this.modalMsg(bt,'plase select text before under MSIE');
		this.execCommand('inserthorizontalrule');
	},
	onfontsize:function(bt){
		var sel ={'8pt':1, '10pt':2, '12pt':3, '14pt':4, '18pt':5,'24pt':6};
		this.modalBox(false);
		for(var itm in sel) {
			var elem=document.createElement('DIV');
			elem.inEditButton={command : 'fontsize',arg:sel[itm]};
			elem.innerHTML=this.tagWrap('<font size="'+sel[itm]+'">'+itm+'</font>');
			this.modalPanel.appendChild(elem);
		}
		this.modalBox(bt);
	},
	onfontfamily:function(bt){
		var sel={'arial' : 'Arial','comic sans ms' : 'Comic Sans','courier new' : 'Courier New','georgia' : 'Georgia', 'helvetica' : 'Helvetica', 'impact' : 'Impact', 'times new roman' : 'Times', 'trebuchet ms' : 'Trebuchet', 'verdana' : 'Verdana'};
		this.modalBox(false);
		this.each(sel,function(v,k,at){
			var elem=document.createElement('DIV');
			elem.inEditButton={command : 'fontname',arg:v};
			elem.innerHTML=this.tagWrap('<font face="'+v+'">'+k+'</font>');
			if(at.indexOf('last')==-1)
				this.Style(elem,{borderBottom:'1px solid #ccc',paddingBottom:'2px'});
			this.modalPanel.appendChild(elem);
		});
		this.modalBox(bt);
	},
	onheadings:function(bt){
		var sel={'h1' : 'H1', 'h2' : 'H2', 'h3' : 'H3', 'h4' : 'H4', 'h5' : 'H5', 'h6' : 'H6'};
		this.modalBox(false);
		for(var itm in sel) {
			var elem=document.createElement(itm);
			elem.inEditButton={command : 'formatblock',arg:'<'+itm+'>'};
			elem.innerHTML=this.tagWrap(this.__(sel[itm]));
			if(itm!='h6')
				this.Style(elem,{borderBottom:'1px solid #ccc',paddingBottom:'2px'});
			this.modalPanel.appendChild(elem);
		}
		this.modalBox(bt);
	},
	oncolor:function(bt){
		var sel=[
			'#FF0000','#00FF00','#0000FF','#FFFFFF','#000000',
			'#3A3939','#5A5A5A','#787878','#B5B5B5','#D6D6D6',
			'#712704','#BD7803','#FE9D01','#FFBB1C','#EED205',
			'#A73800','#FF6600','#FF981F','#FFA500','#F6BF1C',
			'#FF8C05','#FDD283','#43A102','#A2B700','#C5DA01',
			'#036803','#3F813F','#55A255','#74A474','#DA891E',
			'#04477C','#065FB9','#049FF1','#70E1FF','#CBF3FB',
			'#1291A9','#72CFD7','#FF981F','#D1F0EF','#E2EFEE',
			'#4499EE','#8EC2F5','#D6E9FC','#AEC0C2','#E6E6EE',
			'#00CEFF','#31C6E6','#DEDEEE','#E6EFEE','#EFF7F7'
		];
		this.modalBox(false);
		var elem=document.createElement('H5');
		elem.innerHTML=this.__(bt.text);
		this.modalPanel.appendChild(elem);
		for(var i=0;i<sel.length;){
			var elems=document.createElement('DIV');
			for(var j=0;j<5;j++,i++){
				var elem=document.createElement('IMG');
				elems.appendChild(elem);
				elem.src=this.transparentGif;
				elem.inEditButton={command : bt.arg,arg:sel[i]};
				var st={width:'36px',height:'14px',margin:'1px',cursor:'pointer','background-color':sel[i]};
				this.Style(elem,st);
			}
			this.modalPanel.appendChild(elems);
		}
		this.modalBox(bt);
	},
	link:function(){
		var options={title:'',href:'',target:''},cnt=0,seltext='';
		this.walkNode(this.modalPanel,function(n){
			if(!n.name) return;
			switch (n.name) {
			case 'title': options.title=n.value;cnt++;break;
			case 'href': options.href=n.value;cnt++;break;
			case 'target': options.target=n.value;cnt++;break;
			case 'seltext': seltext=n.value;cnt++;break;
			}
			if (cnt==4) return true;
		});
		if (!options.href) return;
		if (this.insTarget.tagName=='A')
			return this.Attr(this.insTarget,options);
		if (this.insTarget.tagName=='IMG' && this.insTarget.parentNode.tagName=='A')
			return this.Attr(this.insTarget.parentNode,options);
		var iswebkit='chrome,safari'.indexOf(this.browser.is)!=-1;
		if (iswebkit && this.insTarget.tagName=='IMG'){
			var elem=document.createElement('A');
			this.Attr(elem,options);
			this.insTarget.parentNode.insertBefore(elem,this.insTarget);
			elem.appendChild(this.insTarget);
			return;
		}
		if (iswebkit && this.insTarget.tagName!='IMG')
			this.execCommand('removeformat');

		var h='javascript:inEditTMP()';
		this.execCommand('createlink',h);
		this.walkNode(this.insActive,function(n){
			if(n.tagName!="A" || h!=n.getAttribute('href')) return;
			n.setAttribute('title',options.title);
			n.setAttribute('href',options.href);
			n.setAttribute('target',options.target);
			if (iswebkit && seltext)
				n.innerHTML=seltext;
		});
	},
	onlink:function(bt){
		var target=this.insTarget;
		if (this.insTarget.tagName=='A')
			var options=this.Attr(this.insTarget,'title,href,target');
		else if(this.insTarget.parentNode && this.insTarget.parentNode.tagName=='A')
			var options=this.Attr(this.insTarget.parentNode,'title,href,target');
		else
			var options={title:this.RangeText,href:'http://',target:''};
		if (this.browser.is=='msie' && options.title=='' && this.Range && this.Range.length==1 && this.Range.item(0).tagName=='IMG' && this.Range.item(0).parentNode && this.Range.item(0).parentNode.tagName=='A')
			var options=this.Attr(this.Range.item(0).parentNode,'title,href,target');
		if (!options.title && options.href=='http://' && this.insTarget.tagName!='IMG')
			if (!(this.browser.is=='msie' && this.Range && this.Range.length==1 && this.Range.item(0).tagName=='IMG'))
				return this.modalMsg(bt,'plase select link title or click image before');
		this.modalBox(false);
		var elems=document.createElement('DIV');
		elems.innerHTML='<input type="hidden" name="seltext" value="'+options.title+'"/>'+
			'<div style="margin:4px 0;"><label>'+this.__('url')+'</label><input name="href" value="'+options.href+'"/></div>'+
			'<div style="margin:4px 0;"><label>'+this.__('title')+'</label><input name="title" value="'+options.title+'"/></div>'+
			'<div style="margin:4px 0;"><label>'+this.__('open in')+'</label><select name="target">'+
			'<option value="" '+(options.target==''?'selected="selected"':'')+'" />'+this.__('current window')+'</option>'+
			'<option value="_blank"  '+(options.target!=''?'selected="selected"':'')+' />'+this.__('new window')+'</option></select></div>';
		var elem=document.createElement('center');
		this.Style(elem,{
			border:'1px solid #CCC',
			padding:'2px',
			cursor:'pointer'
		});
		elem.innerHTML=this.tagWrap(this.__('submit'));
		elem.inEditButton={command:'link'};
		elems.appendChild(elem);
		this.modalPanel.appendChild(elems);
		/*上传接口*/
		var uploadElement=this.uploadElement('href');
		if (uploadElement)
			this.modalPanel.appendChild(uploadElement);
		this.modalBox(bt);
	},
	image:function(){
		var options={alt:'',src:''},cnt=0;
		this.walkNode(this.modalPanel,function(n){
			if(!n.name) return;
			switch (n.name) {
			case 'alt':options.alt=n.value;cnt++;break;
			case 'src':options.src=n.value;cnt++;break;
			}
			if (cnt==2) return true;
		});
		if (!options.src) return;
		if(this.insTarget.tagName=='IMG') return this.Attr(this.insTarget,options);
		var h='javascript:inEditTMP()';
		var iswebkit='chrome,safari'.indexOf(this.browser.is)!=-1;
		this.execCommand('insertImage',h);
		this.walkNode(this.insActive,function(n){
			if(n.tagName!="IMG" || h!=n.getAttribute('src')) return;
			n.setAttribute('alt',options.alt);
			n.setAttribute('src',options.src);
			if (iswebkit)
				n.style.resize='both';
			return true;
		});
	},
	onimage:function(bt){
		if (this.insTarget.tagName=='IMG')
			var options=this.Attr(this.insTarget,'alt,src');
		else
			var options={alt:this.RangeText,src:'http://'};
		if (options.alt=='' && this.browser.is=='msie' && this.Range && this.Range.length==1 && this.Range.item(0).tagName=='IMG')
			options=this.Attr(this.Range.item(0),'alt,src');
		if (!options.alt && options.src=='http://')
			return this.modalMsg(bt,'plase select image or text before');
		this.modalBox(false);
		var elems=document.createElement('DIV');
		elems.innerHTML='<input type="hidden" name="seltext" value="'+options.alt+'"/>'+
			'<div style="margin:4px 0;"><label>'+this.__('image src')+'</label><input name="src" value="'+options.src+'"/></div>'+
			'<div style="margin:4px 0;"><label>'+this.__('alt text')+'</label><input name="alt" value="'+options.alt+'"/></div>';
		var elem=document.createElement('center');
		this.Style(elem,{
			border:'1px solid #CCC',
			padding:'2px',
			cursor:'pointer'
		});
		elem.innerHTML=this.tagWrap(this.__('submit'));
		elem.inEditButton={command:'image'};
		elems.appendChild(elem);
		this.modalPanel.appendChild(elems);

		/*上传接口*/
		var uploadElement=this.uploadElement('src');
		if (uploadElement)
			this.modalPanel.appendChild(uploadElement);
		this.modalBox(bt);
	}
});
/*
 *下面是尚未实现的需要特殊处理的编辑命令,也就是不能直接用document.execCommand发送的命令
 *函数的执行体是随便写的,用于调试目的
 */
inEdit.mixin({
	onundo:function(bt){
		alert(this.insTarget.innerHTML);
	},
	onredo:function(bt){
		alert(this.insTarget.tagName);
	}
});

/***
 *下面编辑命令为了和你的应用配套要重新改写,DIY吧
 */
inEdit.mixin({
	save:function(bt){
		if (typeof this.onSave!='function') return this.modalMsg(bt,'您没有实现onSave接口');
		this.onSave(this.insActive);
	},
	saveAll:function(bt){
		if (typeof this.onSaveAll!='function') return this.modalMsg(bt,'您没有实现onSaveAll接口');
		this.onSaveAll(this.Instances);
	},
	onSave:function(elem){
		this.onSaveAll([elem]);
	},
	onSaveAll:function(elemes){
		alert('传入了'+elemes.length+'个要保存的Element,DIY这个接口吧');
	}
});
/*
 *下面是虚拟接口,通过这个可以理解 inEdit 自定义弹出面板的途径
 *函数的执行体是随便写的,用于调试目的,如果你没有这个需求,可以直接删除里面的执行体
 *到底哪些函数调用了下面这些虚拟接口,可以搜索一下代码
 *同时这段代码中还演示了如何使用inCore.E方法来便捷的建立 Element 并添加到一个 Element
 */
inEdit.mixin({
	uploadElement:function(name){
		var elems=this.E('DIV',{margin:"4px 0"});
		this.E({tagName:'input',type:'file'},elems)
		.E({
			tagName:'button',
			innerHTML:'虚拟上传',
			inEditButton:{keepmodalBox:1,command:'uploadFile',arg:name}
		},elems);
		return elems;
	},
	uploadFile:function(bt){
		alert('虚拟上传接到参数:'+bt.arg);
	}
});