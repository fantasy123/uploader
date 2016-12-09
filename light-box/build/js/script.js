var body=$('body');

var LightBox=function () {
	var self=this;
	this.mask=$('<div id="mask">');
	this.win=$('<div id="popup">');//创建空DOM
	this.gName=null;
	//基于一个指定的根元素(body)的子集,匹配包括那些目前已经匹配到的元素，也包括那些今后可能匹配到的元素。
	//能匹配页面后期动态加载出的元素(动态匹配)
	body.delegate('[data-role=lb]','click',function (e) {
		e.stopPropagation();
		alert($(this).attr('data-group'));
	});
	// this.renderDOM(); 
};

LightBox.prototype={
	renderDOM:function () {
		var strDOM='<div class="pic-view"><span class="btn prev"></span><img src="img/2-2.jpg" class="image"><span class="btn next"></span></div><div class="pic-caption"><div class="caption-area"><div class="pic-desc"></div><div class="index">当前索引:0 of 0</div></div><div class="btn-close"></div></div>';

		this.win.append(strDOM);
		body.append(this.mask,this.win);
	}
};