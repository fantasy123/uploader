var body=$('body'),
	winWidth=$(window).width(),
	winHeight=$(window).height();//视口宽高

var LightBox=function () {
	var self=this;//在this还未偏移时保存起来

	this.mask=$('<div id="mask">');
	this.win=$('<div id="popup">');//创建DOM
	this.gName=null;
	this.gData=[];//确定当前活跃图片组名之后存放该组所有图片的数据

	this.renderDOM(); //渲染出外部框架(先通过css将mask和win隐藏) 是下面一干DOM的依据

	this.picViewArea=this.win.find('.pic-view');//预览区域
	this.popImg=this.win.find('img.image');//图片
	this.picCaptionArea=this.win.find('.pic-caption');//图片描述区域
	this.nextBtn=this.win.find('span.next');
	this.prevBtn=this.win.find('span.prev');
	this.captionTxt=this.win.find('.pic-desc');//描述
	this.curIdx=this.win.find('.index');//当前图片索引
	this.closeBtn=this.win.find('span.btn-close');//关闭按钮

	//delegate能匹配页面后期动态加载出的元素
	//这里是函数入口 事件触发的地方
	body.delegate('[data-role=lb]','click',function (e) {
		//这个函数内部this是image DOM元素,发生了飘移
		e.stopPropagation();

		var curGname=$(this).attr('data-group');//获取当前活跃图片(包装成Jquery对象)的组名

		if (curGname!=self.gName) {//跟之前不是同一组才继续获取
			self.gName=curGname;//成为过去式 用于下一次点击比较
			self.getGroupInfo();//获取不重复的同组信息
		}

		//用获得的数据初始化弹出框
		self.initPop($(this));//传入当前被点击的图片元素封装而成的JQ对象
	});
};

LightBox.prototype={
	//init系开始
	initPop:function (curObj) {
		var	src=curObj.attr('data-source'),
			id=curObj.attr('data-id');
	//获取当前图片的路径与索引,供后面的函数传递

		this.showMaskAndPop(src,id);
	},
	showMaskAndPop:function (src,id) {
		var viewWidth=winWidth/2+10;//10是5px的边框
		var viewHeight=winHeight/2+10;//用到超过一次的,都想着用一个变量存起来

		//把图片区域和文字区域隐藏,后期要用js填充
		this.popImg.hide();
		this.picCaptionArea.hide();

		this.mask.fadeIn();	

		this.picViewArea.css({//图片区设为视口宽高的一半,外层win宽高适应它
			width: winWidth/2,
			height: winHeight/2
		});

		this.win.fadeIn();//先出现

		this.win.css({
			width: viewWidth,
			height: viewHeight,//2个都带了10

			marginLeft:-(viewWidth)/2,//宽度变了 重新计算margin-left水平居中
			top:-viewHeight//先藏到上面看不见的地方
		}).animate({//过渡动画,自上而下,垂直居中
			top: (winHeight-viewHeight)/2},function() {
			//Todo 重中之重 出图片撑开
		});

		//根据当前图片的data-id属性得到在同组数据数组里的索引(判断是否显示上下切换标签)
		this.index=this.getIndex(id);//继续封装一个方法,获取索引保存在对象的index属性上
		
		var gLength=this.gData.length;//数组长度

		//数组长度<=1 不需要切换按钮 不做操作(本来就没有切换按钮)
		if (gLength>1) {//进一步判断
			if(this.index===0){//第一张
				this.prevBtn.addClass('disable');
				this.nextBtn.removeClass('disable');//重新设一遍 防止以前操作过
			}else if(this.index===gLength-1){
				this.prevBtn.removeClass('disable');
				this.nextBtn.addClass('disable');
			}else{//中间 上下都要
				this.prevBtn.removeClass('disable');
				this.nextBtn.removeClass('disable');//防止之前加上了disable 清理掉
			}
		}
	},
	getIndex:function (curId) {
		var idx=0;//初始化用于保存返回值的变量

		//遍历数据数组
		this.gData.forEach(function (e,i) {//参数跟JQ each方法相反
			if(e.id===curId){
				idx=i;

				return false;//跳出循环
			}
		});

		return idx;
	},
	//init系结束

	renderDOM:function () {
		var strDOM='<div class="pic-view"><span class="btn prev"></span><img src="img/2-2.jpg" class="image"><span class="btn next"></span></div><div class="pic-caption"><div class="caption-area"><div class="pic-desc"></div><div class="index">当前索引:0 of 0</div></div><div class="btn-close"></div></div>';

		this.win.append(strDOM);
		body.append(this.mask,this.win);
	},

	getGroupInfo:function () {
		var self=this;

		//根据确定的gName获取img信息,参数传一个属性选择器
		var gList=body.find('[data-group='+this.gName+']');//一个nodeList
		//之前点击事件self.gName=curName 相当于this.gName=curName

		//清空数组,防止不同组的数据叠加起来
		this.gData.length=0;

		gList.each(function(index, el) {
			self.gData.push({//产生一个数据的对象数组
				src:el.getAttribute('data-source'),
				id:el.getAttribute('data-id'),
				caption:el.getAttribute('data-caption')
			});
		});
	}
};