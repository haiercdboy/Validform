/*
    通用表单验证方法
    Validform version 3.0
	For more information, you can visit www.rjboy.cn
	By sean during April 7, 2010 - July 30, 2011
	
	Demo:
	$(".demoform").Validform({//$(".demoform")指明是哪一表单需要验证,名称需加在form表单上;
		btnSubmit:"#btn_sub", //#btn_sub是该表单下要绑定点击提交表单事件的按钮;如果form内含有submit按钮该参数可省略;
		tiptype:1, //可选项 1=>pop box,2=>side tip，默认为1，也可以传入一个function函数，自定义提示信息的显示方式（可以实现你想要的任何效果，具体参见demo页）;
		tipSweep:true,//可选项 true | false ，为true时提示信息将只会在表单提交时触发显示，各表单元素blur时不会被触发显示;
		postonce:true, //可选项 是否开启网速慢时的二次提交防御，true开启，不填则默认关闭;
		ajaxPost:true, //使用ajax方式提交表单数据，默认false，提交地址就是action指定地址;
		datatype:{//传入自定义datatype类型;
			"*6-20": /^[^\s]{6,20}$/,
			"z2-4" : /^[\u4E00-\u9FA5\uf900-\ufa2d]{2,4}$/
		},
		callback:function(data){
			//返回数据data是json格式，{"info":"demo info","status":"y"}
			//info: 输出提示信息;
			//status: 返回提交数据的状态,是否提交成功。如可以用"y"表示提交成功，"n"表示提交失败，在ajax_post.php文件返回数据里自定字符，主要用在callback函数里根据该值执行相应的回调操作;
			//你也可以在ajax_post.php文件返回更多信息在这里获取，进行相应操作；
			
			//这里执行回调操作;
			//注意：如果不是ajax方式提交表单，传入callback表单将不会提交。在验证全部通过后会执行这个回调函数，这种情况data参数不可用。
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
			p:"正在提交数据…",
			err:"提交数据出错，请检查地址是否正确！"
		},
		creatMsgbox=function(){
			if($("#Validform_msg").length!==0){return false;}
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
					var left=($(window).width()-msgobj.width())/2,
						top=($(window).height()-msgobj.height())/2,
						topTo=(document.documentElement.scrollTop?document.documentElement.scrollTop:document.body.scrollTop)+(top>0?top:0);
					
					msgobj.animate({
						left : left,
						top : topTo
					},{ duration:400 , queue:false });
				}
			});
		};

	$.fn.Validform=function(settings){
		var defaults={};
		settings=$.extend({},$.fn.Validform.sn.defaults,settings);
		settings.datatype && $.extend($.Datatype,settings.datatype);

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
					if($.trim($(this).val())===''){
						$(this).val(defaultvalue);
						if(altercss){$(this).addClass(altercss);}
					}
				});
			});

			//绑定blur事件;
			$this.find("[datatype]").blur(function(){
				var flag=true;
				flag=$.fn.Validform.sn.checkform($(this),$this,{type:settings.tiptype,sweep:settings.tipSweep},"hide");

				if(!flag){return false;}
				if(typeof(flag)!="boolean"){//如果是radio, checkbox, select则不需再执行下面的代码;
					$(this).removeClass("Validform_error");
					return false;
				}

				flag=$.fn.Validform.sn.regcheck($(this).attr("datatype"),$(this).val());
				if(!flag){
					if($(this).attr("ignore")==="ignore" && ( $(this).val()==="" || $(this).val()===$(this).attr("tip") )){
						if(settings.tiptype==2){
							$(this).parent().next().find(".Validform_checktip").removeClass().addClass("Validform_checktip").text("");
						}else if(typeof settings.tiptype == "function"){
							(settings.tiptype)("",{obj:$(this),type:4},$.fn.Validform.sn.cssctl);
						}
						flag=true;
						errorobj=null;
						return true;
					}
					errorobj=$(this);
					$.fn.Validform.sn.showmsg($(this).attr("errormsg")||tipmsg.w,settings.tiptype,{obj:$(this),sweep:settings.tipSweep},"hide"); //当tiptype=1的情况下，传入"hide"则让提示框不弹出,tiptype=2的情况下附加参数"hide"不起作用;
				}else{
					if($(this).attr("ajaxurl")){
						var inputobj=$(this);
						inputobj.attr("valid",tipmsg.c);
						$.fn.Validform.sn.showmsg(tipmsg.c,settings.tiptype,{obj:inputobj,type:1,sweep:settings.tipSweep},"hide");
						$.ajax({
							type: "POST",
							url: inputobj.attr("ajaxurl"),
							data: "param="+$(this).val()+"&name="+$(this).attr("name"),
							dataType: "text",
							success: function(s){
								if(s=="y"){
									inputobj.attr("valid","true");
									errorobj=null;
									$.fn.Validform.sn.showmsg(tipmsg.r,settings.tiptype,{obj:inputobj,type:2,sweep:settings.tipSweep},"hide");
								}else{
									inputobj.attr("valid",s);
									errorobj=inputobj;
									$.fn.Validform.sn.showmsg(s,settings.tiptype,{obj:inputobj,sweep:settings.tipSweep});
								}
							},
							error: function(){
								inputobj.attr("valid",tipmsg.err);
								errorobj=inputobj;
								$.fn.Validform.sn.showmsg(tipmsg.err,settings.tiptype,{obj:inputobj,sweep:settings.tipSweep});	
							}
						});
					}else{
						errorobj=null;
						$.fn.Validform.sn.showmsg(tipmsg.r,settings.tiptype,{obj:$(this),type:2,sweep:settings.tipSweep},"hide");
					}
				}

			});
			
			$this.find(":checkbox[datatype],:radio[datatype]").each(function(){
				var _this=$(this);
				var name=_this.attr("name");
				$this.find("[name="+name+"]").filter(":checkbox,:radio").not("[datatype]").bind("blur",function(){
					_this.trigger("blur");
				});
			});

			//subform
			var subform=function(){
				var flag=true;
				if(posting){return false;}

				$this.find("[datatype]").each(function(){
					flag=$.fn.Validform.sn.checkform($(this),$this,{type:settings.tiptype,sweep:settings.tipSweep});

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
						if($(this).attr("ignore")==="ignore" && ( $(this).val()==="" || $(this).val()===$(this).attr("tip") )){
							flag=true;
							errorobj=null;
							return true;
						}
						errorobj=$(this);
						errorobj.focus();
						$.fn.Validform.sn.showmsg($(this).attr("errormsg")||tipmsg.w,settings.tiptype,{obj:$(this),sweep:settings.tipSweep});
						return false;
					}

					if($(this).attr("ajaxurl")){
						if($(this).attr("valid")!="true"){
							flag=false;
							var thisobj=$(this);
							errorobj=thisobj;
							errorobj.focus();
							$.fn.Validform.sn.showmsg(thisobj.attr("valid") || tipmsg.v,settings.tiptype,{obj:thisobj,sweep:settings.tipSweep});
							if(!msghidden || settings.tiptype!=1){
								setTimeout(function(){
									thisobj.trigger("blur");
								},2000);
							}
							return false;
						}else{
							$.fn.Validform.sn.showmsg(tipmsg.r,settings.tiptype,{obj:$(this),type:2,sweep:settings.tipSweep},"hide");
							flag=true;
						}
					}
				});

				if(flag && !posting){
					errorobj=null;
					if(settings.postonce){posting=true;}
					if(settings.ajaxPost){
						$.fn.Validform.sn.showmsg(tipmsg.p,settings.tiptype,{type:1,sweep:settings.tipSweep},"alwaysshow");//传入"alwaysshow"则让提示框不管当前tiptye为1还是2都弹出;
						$.ajax({
							type: "POST",
							dataType:"json",
							url: $this.attr("action"),
							data: $this.serialize(),
							success: function(data){
								$.fn.Validform.sn.showmsg(data.info,settings.tiptype,{type:2,sweep:settings.tipSweep},"alwaysshow");
								settings.callback && (settings.callback)(data);
							},
							error: function(){
								$.fn.Validform.sn.showmsg(tipmsg.err,settings.tiptype,{type:3,sweep:settings.tipSweep},"alwaysshow");
							}
						});
						return false;
					}else{
						settings.callback ? (settings.callback)() : $this.get(0).submit();
					}
				}

			};

			settings.btnSubmit && $this.find(settings.btnSubmit).bind("click",subform);
			$this.submit(function(){
				subform();
				return false;
			});
		});

		//预创建pop box;
		if( settings.tiptype==1 || (settings.tiptype==2 && settings.ajaxPost) ){		
			creatMsgbox();
		}

	};

	$.fn.Validform.sn={
		defaults:{
			tiptype:1,
			tipSweep:false,
			postonce:false,
            ajaxPost:false
		},
		
		toString:Object.prototype.toString,

		regcheck:function(type,gets){
			if(!(type in $.Datatype)){
				var mac=type.match($.Datatype["match"]),
					temp;
				reg:for(var name in $.Datatype){
					temp=name.match($.Datatype["match"]);
					if(!temp){continue reg;}
					if(mac[1]===temp[1]){
						var str=$.Datatype[name].toString();
						var regxp=new RegExp("\\{"+temp[2]+","+temp[3]+"\\}");
    			        str=str.replace(regxp,"{"+mac[2]+","+mac[3]+"}").replace(/^\//,"").replace(/\/$/,"");
				        $.Datatype[type]=new RegExp(str);
						break reg;
					}	
				}
			}
			
			if(this.toString.call($.Datatype[type])=="[object RegExp]"){
				return $.Datatype[type].test(gets);
			}
			
			return false;
		},

		showmsg:function(msg,type,o,show){//o:{obj:当前对象, type:1=>正在检测 | 2=>通过}, show用来判断tiptype=1的情况下是否弹出信息框;
			if(errorobj){errorobj.addClass("Validform_error");}
			if(typeof type == "function"){
				if(!(o.sweep && show=="hide")){
					(type)(msg,o,this.cssctl);
				}
				return false;
			}

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
				o.obj.parent().next().find(".Validform_checktip").text(msg);
				this.cssctl(o.obj.parent().next().find(".Validform_checktip"),o.type);
			}

		},

		checkform:function(obj,parentobj,tiptype,show){//show用来判断是表达提交还是blur事件引发的检测;
			var errormsg=obj.attr("errormsg") || tipmsg.w,
                inputname;

			if(obj.is("[datatype='radio']")){  //判断radio表单元素;
				inputname=obj.attr("name");
				var radiovalue=parentobj.find(":radio[name="+inputname+"]:checked").val();
				if(!radiovalue){
					errorobj=obj;
					this.showmsg(errormsg,tiptype.type,{obj:obj,sweep:tiptype.sweep},show);
					return false;
				}
				errorobj=null;
				this.showmsg(tipmsg.r,tiptype.type,{obj:obj,type:2,sweep:tiptype.sweep},"hide");
				return "radio";
			}

			if(obj.is("[datatype='checkbox']")){  //判断checkbox表单元素;
				inputname=obj.attr("name");
				var checkboxvalue=parentobj.find(":checkbox[name="+inputname+"]:checked").val();
				if(!checkboxvalue){
					errorobj=obj;
					this.showmsg(errormsg,tiptype.type,{obj:obj,sweep:tiptype.sweep},show);
					return false;
				}
				errorobj=null;
				this.showmsg(tipmsg.r,tiptype.type,{obj:obj,type:2,sweep:tiptype.sweep},"hide");
				return "checkbox";
			}

			if(obj.is("[datatype='select']")){  //判断select表单元素;
				if(!obj.val()){
				  errorobj=obj;
				  this.showmsg(errormsg,tiptype.type,{obj:obj,sweep:tiptype.sweep},show);
				  return false;
				}
				errorobj=null;
				this.showmsg(tipmsg.r,tiptype.type,{obj:obj,type:2,sweep:tiptype.sweep},"hide");
				return "select";
			}

			var defaultvalue=obj.attr("tip");
			if((obj.val()==="" || obj.val()===defaultvalue) && obj.attr("ignore")!="ignore"){
				errorobj=obj;
				this.showmsg(obj.attr("nullmsg") || tipmsg.s,tiptype.type,{obj:obj,sweep:tiptype.sweep},show);
				return false;
			}

			if(obj.attr("recheck")){
				var theother=parentobj.find("input[name="+obj.attr("recheck")+"]:first");
				if(obj.val()!=theother.val()){
					errorobj=obj;
					this.showmsg(errormsg,tiptype.type,{obj:obj,sweep:tiptype.sweep},show);
					return false;
				}
			}

			obj.removeClass("Validform_error");
			errorobj=null;
			return true;
		},
		cssctl:function(obj,status){
			switch(status){
				case 1:
					obj.removeClass("Validform_right Validform_wrong").addClass("Validform_checktip Validform_loading");//checking;
					break;
				case 2:
					obj.removeClass("Validform_wrong Validform_loading").addClass("Validform_checktip Validform_right");//passed;
					break;
				case 4:
					obj.removeClass("Validform_right Validform_wrong Validform_loading").addClass("Validform_checktip");//for ignore;
					break;
				default:
					obj.removeClass("Validform_right Validform_loading").addClass("Validform_checktip Validform_wrong");//wrong;
			}	
		}

	};

	//公用方法显示&关闭信息提示框;
	$.Showmsg=function(msg){
		creatMsgbox();
		$.fn.Validform.sn.showmsg(msg,1);
	};
	$.Hidemsg=function(){
		msgobj.hide();
		msghidden=true;
	};
	$.Datatype={
		"match":/^(.+)(\d+)-(\d+)$/,
		"*":/^[^\s]+$/,
		"*6-16":/^[^\s]{6,16}$/,
		"n":/^\d+$/,
		"s":/^[\u4E00-\u9FA5\uf900-\ufa2d\w]+$/,
		"s6-18":/^[\u4E00-\u9FA5\uf900-\ufa2d\w]{6,18}$/,
		"p":/^[0-9]{6}$/,
		"m":/^13[0-9]{9}$|15[0-9]{9}$|18[0-9]{9}$/,
		"e":/^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
	};
})(jQuery);