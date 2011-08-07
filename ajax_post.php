<?php
    header("Content-Type:text/html; charset=utf-8");
	//sleep(3);
	//表单数据是以POST方式提交过来;
	
	//注意json数据必须严格按如下格式输出：{"info":"demo info","status":"y"};
	//info: 输出提示信息;
	//status: 返回提交数据的状态,是否提交成功。如可以用“y”表示提交成功，“n”表示提交失败，主要用在callback函数里根据该值执行相应的回调操作;
    echo '{
		"info":"数据已成功提交！",
		"status":"y"
	}';
?>