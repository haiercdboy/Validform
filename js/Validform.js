/*
	通用表单验证方法
	Validform version 2.0
	For more information, you can visit http://www.rjboy.cn
	By sean at April 7, 2010 - April 22, 2011
	
	Demo:
	$(".demoform").Validform({//$(".demoform")指明是哪一表单需要验证,名称需加在from表单上;
		btnSubmit:"#btn_sub", //#btn_sub是该表单下要绑定点击提交表单事件的按钮;如果form内含有submit按钮该参数可省略;
		tiptype:1, //可选项 1=>pop box,2=>side tip，默认为1;
		postonce:true, //可选项 是否开启网速慢时的二次提交防御，true开启，不填则默认关闭;
		ajaxurl:"ajax_post.php", //ajax提交表单数据;
		callback:function(data){
			//返回数据data是json格式，{"info":"demo info","status":"y"}
			//info: 输出提示信息;
			//status: 返回提交数据的状态,是否提交成功。如可以用"y"表示提交成功，"n"表示提交失败，在ajax_post.php文件返回数据里自定字符，主要用在callback函数里根据该值执行相应的回调操作;
			//你也可以在ajax_post.php文件返回更多信息在这里获取，进行相应操作；
			
			//这里执行回调操作;
		}
	});
*/

(function($){
	var errorobj=null,//指示当前验证失败的表单元素;
		msgobj,//pop box object 
		msghidden=true, //msgbox hidden?
		tipmsg={//默认提示文字;
			w:"请输入正确信息！",
			r:"通过信息验证！",
			c:"正在检测信息…",
			s:"请填入信息！",
			v:"所填信息没有经过验证，请稍后…",
			p:"正在提交数据…"
		},
		creatMsgbox=function(){
			if($("#Validform_msg").length!=0){return false;}
			msgobj=$('<div id="Validform_msg"><div class="Validform_title">提示信息<a class="Validform_close" href="javascript:void(0);">&chi;</a></div><div class="Validform_info"></div><div class="iframe"><iframe frameborder="0" scrolling="no" height="100%" width="100%"></iframe></div></div>').appendTo("body");//提示信息框;
			msgobj.find("a.Validform_close").click(function(){
				msgobj.hide();
				msghidden=true;
				if(errorobj){
					errorobj.focus().addClass("Validform_error");
				}
				return false;
			}).focus(function(){this.blur();});

			$(window).bind("scroll resize",function(){
				if(!msghidden){				  
					var left=($(window).width()-msgobj.width())/2;
					var top=($(window).height()-msgobj.height())/2;
					var topTo=(document.documentElement.scrollTop?document.documentElement.scrollTop:document.body.scrollTop)+(top>0?top:0);
					msgobj.animate({
						left : left,
						top : topTo
					},{ duration:400 , queue:false });
				}
			})
		};
	
	$.fn.Validform=function(settings){
		var defaults={};
		settings=$.extend({},$.fn.Validform.sn.defaults,settings);
		
		this.each(function(){
			var $this=$(this);
			var posting=false; //防止表单按钮双击提交两次;
			$this.find("[tip]").each(function(){//tip是表单元素的默认提示信息,这是点击清空效果;
				var defaultvalue=$(this).attr("tip");
				var altercss=$(this).attr("altercss");
				$(this).focus(function(){
					if($(this).val()==defaultvalue){
						$(this).val('');
						if(altercss){$(this).removeClass(altercss);}
					}
				}).blur(function(){
					if($.trim($(this).val())==''){
						$(this).val(defaultvalue);
						if(altercss){$(this).addClass(altercss);}
					}
				});
			});
			
			//绑定blur事件;
			$this.find("[datatype]").blur(function(){
				var flag=true;
				flag=$.fn.Validform.sn.checkform($(this),$this,settings.tiptype,"hide");

				if(!flag){return false;}
				if(typeof(flag)!="boolean"){//如果是radio, checkbox, select则不需再执行下面的代码;
					$(this).removeClass("Validform_error");
					return false;
				}
										
				flag=$.fn.Validform.sn.regcheck($(this).attr("datatype"),$(this).val());
				if(!flag){
					if($(this).attr("ignore")=="ignore" && ( $(this).val()=="" || $(this).val()==$(this).attr("tip") )){
						if(settings.tiptype==2){
							$(this).parent().next().find(".Validform_checktip").removeClass().addClass("Validform_checktip").text($(this).attr("tip"));
						}
						flag=true;
						return true;
					}
					errorobj=$(this);
					$.fn.Validform.sn.showmsg($(this).attr("errormsg")||tipmsg.w,settings.tiptype,{obj:$(this)},"hide"); //当tiptype=1的情况下，传入"hide"则让提示框不弹出,tiptype=2的情况下附加参数“hide”不起作用;
				}else{
					if($(this).attr("ajaxurl")){
						var inputobj=$(this);
						inputobj.attr("valid",tipmsg.c);
						$.fn.Validform.sn.showmsg(tipmsg.c,settings.tiptype,{obj:inputobj,type:1},"hide");
						$.ajax({
							type: "POST",
							url: inputobj.attr("ajaxurl"),
							data: "param="+$(this).val(),
							dataType: "text",
							success: function(s){
								if(s=="y"){
									inputobj.attr("valid","true");
									$.fn.Validform.sn.showmsg(tipmsg.r,settings.tiptype,{obj:inputobj,type:2},"hide");
								}else{
									inputobj.attr("valid",s);
									errorobj=inputobj;
									$.fn.Validform.sn.showmsg(s,settings.tiptype,{obj:inputobj});
								}
							}
						});
					}else{
						errorobj=null;
						$.fn.Validform.sn.showmsg(tipmsg.r,settings.tiptype,{obj:$(this),type:2},"hide");
					}
				};
				
			});
			
			//subform
			var subform=function(){
				var flag=true;
				if(posting){return false;}
				
				$this.find("[datatype]").each(function(){
					flag=$.fn.Validform.sn.checkform($(this),$this,settings.tiptype);

					if(!flag){
						errorobj.focus();
						return false;
					}
					
					if(typeof(flag)!="boolean"){
						flag=true;
						return true;
					}
					
					flag=$.fn.Validform.sn.regcheck($(this).attr("datatype"),$(this).val());
					
					if(!flag){
						if($(this).attr("ignore")=="ignore" && ( $(this).val()=="" || $(this).val()==$(this).attr("tip") )){
							flag=true;
							return true;
						}
						errorobj=$(this);
						errorobj.focus();
						$.fn.Validform.sn.showmsg($(this).attr("errormsg")||tipmsg.w,settings.tiptype,{obj:$(this)});
						return false;
					}
					
					if($(this).attr("ajaxurl")){
						if($(this).attr("valid")!="true"){
							flag=false;
							var thisobj=$(this);
							errorobj=thisobj;
							errorobj.focus();
							$.fn.Validform.sn.showmsg(thisobj.attr("valid") || tipmsg.v,settings.tiptype,{obj:thisobj});
							if(!msghidden || settings.tiptype==2){
								setTimeout(function(){
									thisobj.trigger("blur");
								},2000);
							}
							return false;
						}else{
							$.fn.Validform.sn.showmsg(tipmsg.r,settings.tiptype,{obj:$(this),type:2},"hide");
							flag=true;
						}
					}
				})
				
				if(flag && !posting){
					errorobj=null;
					if(settings.postonce){posting=true;}
					if(settings.ajaxurl){
						$.fn.Validform.sn.showmsg(tipmsg.p,settings.tiptype,{obj:$(this)},"alwaysshow");//传入“alwaysshow”则让提示框不管当前tiptye为1还是2都弹出;
						$.ajax({
							type: "POST",
							dataType:"json",
							url: settings.ajaxurl,
							data: $this.serialize(),
							success: function(data){
								$.fn.Validform.sn.showmsg(data.info,settings.tiptype,{obj:$(this)},"alwaysshow");
								(settings.callback)(data);
							}
						});
						return false;
					}else{
						$this.get(0).submit();
					}
				}
				
			}
			
			$this.find(settings.btnSubmit).bind("click",subform);
			$this.submit(function(){
				subform();
				return false;
			});
		})
		
		//预创建pop box;
		if(settings.tiptype!=2 || settings.ajaxurl){		
			creatMsgbox();
		}
		
	}
	
	$.fn.Validform.sn={
		defaults:{
			tiptype:1
		},
		
		regcheck:function(type,gets){
			switch(type){
				case "*":
					return true;
				case "*6-16":
					var repost= /[^\s]{6,16}/;
					return repost.test(gets);
				case "n":
					return !isNaN(gets);
				case "s":
					return isNaN(gets);
				case "s6-18":
					var repost= /^[\u4E00-\u9FA5\uf900-\ufa2d\w]{6,18}$/;
					return repost.test(gets);
				case "p":
					var repost= /^[0-9]{6}$/;
					return repost.test(gets);
				case "m":
					var repost= /^13[0-9]{1}[0-9]{8}$|15[0189]{1}[0-9]{8}$|18[2689]{1}[0-9]{8}$/;
					return repost.test(gets);
				case "e":
					var repost = /\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/;
					return repost.test(gets);
				default:
					return false;
			}
		},
		
		showmsg:function(msg,type,o,show){//o:{obj:当前对象, type:1=>正在检测 | 2=>通过}, show用来判断tiptype=1的情况下是否弹出信息框;
			if(errorobj){errorobj.addClass("Validform_error");}
			
			if(type==1 || show=="alwaysshow"){
				msgobj.find(".Validform_info").text(msg);
			}

			if(type==1 && show!="hide" || show=="alwaysshow"){
				msghidden=false;
				msgobj.find(".iframe").css("height",msgobj.height());
				var left=($(window).width()-msgobj.width())/2;
				var top=($(window).height()-msgobj.height())/2;
				top=(document.documentElement.scrollTop?document.documentElement.scrollTop:document.body.scrollTop)+(top>0?top:0);
				msgobj.css({
					"left":left
				}).show().animate({
					top:top
				},100);
			}
			
			if(type==2){
				if(o.type){
					switch(o.type){
						case 1://正在检测;
							o.obj.parent().next().find(".Validform_checktip").removeClass().addClass("Validform_checktip Validform_loading").text(msg);
							break;
						case 2://检测通过;
							o.obj.parent().next().find(".Validform_checktip").removeClass().addClass("Validform_checktip Validform_right").text(msg);	
					}
				}else{
					o.obj.parent().next().find(".Validform_checktip").removeClass().addClass("Validform_wrong Validform_checktip").text(msg);
				}
			}
			
		},
		
		checkform:function(obj,parentobj,tiptype,show){//show用来判断是表达提交还是blur事件引发的检测;
			var errormsg=obj.attr("errormsg") || tipmsg.w;
			
			if(obj.is("[datatype='radio']")){  //判断radio表单元素;
				var inputname=obj.attr("name");
				var radiovalue=parentobj.find(":radio[name="+inputname+"]:checked").val();
				if(!radiovalue){
					errorobj=obj;
					this.showmsg(errormsg,tiptype,{obj:obj},show);
					return false;
				}
				errorobj=null;
				this.showmsg(tipmsg.r,tiptype,{obj:obj,type:2},"hide");
				return "radio";
			}

			if(obj.is("[datatype='checkbox']")){  //判断checkbox表单元素;
				var inputname=obj.attr("name");
				var checkboxvalue=parentobj.find(":checkbox[name="+inputname+"]:checked").val();
				if(!checkboxvalue){
					errorobj=obj;
					this.showmsg(errormsg,tiptype,{obj:obj},show);
					return false;
				}
				errorobj=null;
				this.showmsg(tipmsg.r,tiptype,{obj:obj,type:2},"hide");
				return "checkbox";
			}

			if(obj.is("[datatype='select']")){  //判断select表单元素;
				if(!obj.val()){
				  errorobj=obj;
				  this.showmsg(errormsg,tiptype,{obj:obj},show);
				  return false;
				}
				errorobj=null;
				this.showmsg(tipmsg.r,tiptype,{obj:obj,type:2},"hide");
				return "select";
			}
			
			var defaultvalue=obj.attr("tip");
			if((obj.val()=="" || obj.val()==defaultvalue) && obj.attr("ignore")!="ignore"){
				errorobj=obj;
				this.showmsg(obj.attr("nullmsg") || tipmsg.s,tiptype,{obj:obj},show);
				return false;
			}
			
			if(obj.attr("recheck")){
				var theother=parentobj.find("input[name="+obj.attr("recheck")+"]:first");
				if(obj.val()!=theother.val()){
					errorobj=obj;
					this.showmsg(errormsg,tiptype,{obj:obj},show);
					return false;
				}
			}
			
			obj.removeClass("Validform_error");
			errorobj=null;
			return true;
		}
		
	}
	
	//公用方法显示&关闭信息提示框;
	$.Showmsg=function(msg){
		creatMsgbox();
		$.fn.Validform.sn.showmsg(msg,1);
	};
	$.Hidemsg=function(){
		msgobj.hide();
		msghidden=true;
	}

})(jQuery);