var body=$('body'),
	winWidth=$(window).width(),
	winHeight=$(window).height();

var LightBox=function (settings) {//接收配置对象
	this.isMozilla=/Mozilla\/5.0/gi.test(window.navigator.userAgent);//(gi)全局不分大小写匹配
	//一个bool值 用于后面代码里IE 6的hack 

	var self=this;

	this.settings={//默认值,后面用的也是它里面的属性,传入的settings只是扩展它
		speed:600
	};

	//类级别方法,用于合并对象,不同属性添加,相同属性覆盖
	$.extend(this.settings,settings||{});//如果我们没有传配置项,那么给一个{}

	this.mask=$('<div id="mask">');//$(htmlstr)可以创建一个JQ对象
	this.win=$('<div id="popup">');
	this.gName=null;
	this.gData=[];//确定当前活跃图片组名=>根据组名获取nodeList=>遍历nodeList分别获取三个属性=>push进gData里

	this.renderDOM();//渲染展示区DOM结构

	//调用过renderDOM方法后,这些JQ对象才取得到
	this.picViewArea=this.win.find('.pic-view');
	this.popImg=this.win.find('img.image');
	this.picCaptionArea=this.win.find('.pic-caption');
	this.nextBtn=this.win.find('span.next');
	this.prevBtn=this.win.find('span.prev');
	this.captionTxt=this.win.find('.pic-desc');
	this.curIdx=this.win.find('.index');
	this.closeBtn=this.win.find('.btn-close');

	body.delegate('[data-role=lb]','click',function (e) {//函数入口 绑定事件的地方
		e.stopPropagation();

		var curGname=$(this).attr('data-group');//获取当前被点击图片的组名

		if (curGname!=self.gName) {//跟之前不是同一组才继续获取
			self.gName=curGname;//成为过去式 用于下一次点击比较
			self.getGroupInfo();//获取该组所有图片信息
			// getGroupInfo要用到this.gName,所以上2句顺序不能换
		}

		//用获得的当前图片数据初始化弹出框
		self.initPop($(this));//传入当前被点击的图片对象

		//只要点击任何一个图片,这个事件就绑上了
		self.mask.click(function() {//点击遮罩关闭窗口
			$(this).fadeOut();
			self.win.fadeOut();
			self.clear=false;//关闭图片,禁止调用resize事件
		});

		self.closeBtn.click(function () {//关闭按钮的功能
			self.mask.fadeOut();
			self.win.fadeOut();
			self.clear=false;//关闭图片,禁止调用resize事件
		});

		self.flag=true;//判断上下切换按钮是否可以点击
		
		self.nextBtn.hover(function() {//绑定悬浮显示上下切换按钮的事件
			if(!($(this).hasClass('disable'))){
				$(this).addClass('show');
			}
		}, function() {
			if(!($(this).hasClass('disable'))){
				$(this).removeClass('show');
			}
		}).click(function (e) {
			e.stopPropagation();

			if(!$(this).hasClass('disable')&&self.flag){//true表示可以点
				self.flag=!self.flag;//点击之后立刻置反,禁止点击,等图片加载完之后才重置为true
				//防止图片延迟的时候重复点击
				self.goto('next');
			}
		});
		self.prevBtn.hover(function() {
			if(!($(this).hasClass('disable'))){
				$(this).addClass('show');
			}
		}, function() {
			if(!($(this).hasClass('disable'))){
				$(this).removeClass('show');
			}
		}).click(function (e) {
			e.stopPropagation();

			if(!$(this).hasClass('disable')&&self.flag){
				self.flag=!self.flag;//强制让等待图片加载完才可以接着点
				self.goto('prev');
			}
		});//disable类是判断显不显示箭头和是否允许执行goto的唯一条件
	});

	var timer=null;
	this.clear=false;

	$(window).resize(function(event) {//在这里绑定即使关掉弹窗也会执行resize,借助this.clear这个bool值来决定是否执行
		if(self.clear){//大图出现,动画也加载完,才置true,允许resize
			clearTimeout(timer);//先清除之前的定时器,防止冲突

			timer=setTimeout(function () {
				self.loadPic(self.gData[self.index].src);//一调整尺寸就触发,会有卡顿
			},200);//200ms后只执行一次,避免一直调用卡顿 200ms能保证跟手
		}
	}).keyup(function(event) {//绑定键盘监听事件
		if(self.clear){//跟resize一样 只有图片打开才能绑定监听事件
			var keyCode=event.which;

			if (keyCode===37||keyCode===38) {//向上向左
				self.prevBtn.trigger('click');
			} else if(keyCode===39||keyCode===40){//向下向右
				self.nextBtn.trigger('click');
			}
		}
	});
};

LightBox.prototype={
	//上下切换图片的方法
	goto:function (dir) {
		if(dir==='next'){
			this.index++;//index已更新

			if(this.index>=this.gData.length-1){//到最后
				this.nextBtn.addClass('disable').removeClass('show');
			};

			if(this.index!==0){//数组物理左端(跟data-id没关系)
				this.prevBtn.removeClass('disable');
			};

			var src=this.gData[this.index].src;//根据更新后的index获得下一张src
			//调用loadPic函数切换下一张图片
			this.loadPic(src);
		}else{
			this.index--;//this.index更新到上一张

			if(this.index<=0){//到第一张
				this.prevBtn.addClass('disable').removeClass('show');
			};

			if(this.index!==this.gData.length-1){//数组物理右端
				this.nextBtn.removeClass('disable');
			};

			var src=this.gData[this.index].src;//根据更新后的index获得上一张的src
			//调用loadPic函数切换上一张图片
			this.loadPic(src);
		}
	},
	//init系开始
	initPop:function (curObj) {
		var	src=curObj.attr('data-source'),
			id=curObj.attr('data-id');

		this.showMaskAndPop(src,id);//用当前图片的路径和索引来初步构建popwin
	},
	showMaskAndPop:function (src,id) {
		var self=this,
			viewWidth=winWidth/2+10,//用到超过一次的,都想着用一个变量存起来
			viewHeight=winHeight/2+10;

		this.popImg.hide();
		this.picCaptionArea.hide();//把图片区域和文字区域隐藏,后期再用js填充

		this.mask.fadeIn();	

		this.picViewArea.css({//图片区设为视口宽高的一半,外层win宽高适应它
			width: winWidth/2,
			height: winHeight/2
		});

		this.win.fadeIn();//win出现

		this.win.css({
			width: viewWidth,
			height: viewHeight,//给win设宽高动画

			marginLeft:-(viewWidth)/2,//给win水平居中定位
			top:-viewHeight//先藏到上面看不见的地方
		}).animate({//过渡动画=>自上而下=>垂直居中
			top: (winHeight-viewHeight)/2},self.settings.speed,function() {
			self.loadPic(src);//框架到位=>载入图片
		});

		//根据当前图片的data-id属性得到在同组数据数组里的索引(判断是否显示上下切换标签)
		this.index=this.getIndex(id);//继续封装一个方法,获取索引保存在对象的index属性上
		
		var gLength=this.gData.length;

		if (gLength>1) {//一组多张
			if(this.index===0){//第一张
				this.prevBtn.addClass('disable');
				this.nextBtn.removeClass('disable');//重新设一遍 防止以前操作过
			}else if(this.index===gLength-1){
				this.prevBtn.removeClass('disable');
				this.nextBtn.addClass('disable');
			}else{//中间
				this.prevBtn.removeClass('disable');
				this.nextBtn.removeClass('disable');//防止之前加上了disable 清理掉
			}
		}
		else if(gLength===1){//一组一张
			this.prevBtn.addClass('disable');
			this.nextBtn.addClass('disable');
		}
	},
	loadPic:function (picSrc) {
		var self=this;

		self.popImg.css({
			width: 'auto',
			height: 'auto'
		}).hide();//清除上次图片的宽高

		this.picCaptionArea.hide();

		this.preLoadImg(picSrc,function () {//图片预加载只是一种优化手段,callback才是干活的地方
			//图片加载完的回调函数
			self.popImg.attr('src',picSrc); 

			var imgWidth=self.popImg.width(),
				imgHeight=self.popImg.height();

			self.setSize(imgWidth,imgHeight); //得到当前点击的图片宽高,设置展开动画
		}); 
	},
	setSize:function (w,h) {//图片宽高传入
		var self=this,
			winW=$(window).width(),
			winH=$(window).height();

		var scale=Math.min(winW/(w+10),winH/(h+10),1); //保证图片在视口里的系数

		w=w*scale;
		h=h*scale;//过滤图片宽高

		//以过滤出的宽高为目标值开始动画
		this.picViewArea.animate({//图片区动画
			width: w-10,
			height: h-10
		},self.settings.speed);	

		this.win.animate({//窗口动画(适应图片区)
			width: w,
			height: h,
			marginLeft:-w/2,//水平
			top:(winH-h)/2//垂直居中
		},self.settings.speed,function () {
			self.popImg.css({
				width: w-10,
				height: h-10
			}).fadeIn();//设置宽高并显示之前隐藏的图片

			self.picCaptionArea.fadeIn();//展示描述区
			self.flag=true;//图片加载完成 允许点击切换按钮
			self.clear=true;//图片加载完成 允许绑定resize事件
			//前者是防止图片加载过程重复点击 后者是防止关掉弹出层依然监听resize事件
		});

		//字和索引等归位
		this.captionTxt.text(this.gData[this.index].caption);//填充描述区
		this.curIdx.text('当前索引:'+(this.index+1)+' of '+this.gData.length);//填充索引区
	},
	preLoadImg:function (src,callback) {//图片预加载
		//src的获取过程:点击=>$(this)=>initPop里attr=>传给showMaskandPop=>传给loadPic=>传给preloadImg
		//callback接收的是loadPic方法里的一个匿名函数
		var img=new Image();

		if (window.ActiveXObject) {	//IE
			img.onreadystatechange=function () {
				if(this.readyState==='complete'){
					callback();
				}
			};
		} else {//现代浏览器
			img.onload=function () {
				callback();
			};
		}

		img.src=src;//图片源地址声明
	},
	getIndex:function (curId) {
		var idx=0;//初始化用于保存返回值的变量

		//遍历数据数组
		this.gData.forEach(function (e,i) {//参数跟JQ each方法相反
			if(e.id===curId){//curId是前面initpop里通过attr取出来,一路传过来的
				idx=i;

				return false;//跳出循环
			}
		});

		return idx;//物理索引
	},
	//init系结束

	renderDOM:function () {
		//图片区和描述区的DOM string
		var strDOM='<div class="pic-view"><span class="btn prev"></span><img src="img/2-2.jpg" class="image"><span class="btn next"></span></div><div class="pic-caption"><div class="caption-area"><div class="pic-desc"></div><div class="index">当前索引:0 of 0</div></div><div class="btn-close"></div></div>';
		this.win.append(strDOM);
		body.append(this.mask,this.win);//可以传2个参数
	},

	getGroupInfo:function () {
		var self=this;
		var gList=body.find('[data-group='+this.gName+']');
		
		this.gData.length=0;//清空数组,防止不同组的数据叠加起来

		gList.each(function(index, el) {
			self.gData.push({//产生一个自定义数据的对象数组(Model),用于后期构建DOM
				src:el.getAttribute('data-source'),
				id:el.getAttribute('data-id'),
				caption:el.getAttribute('data-caption')
			});
		});
	}
};