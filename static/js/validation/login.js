/**
 * Created by Neel on 16/06/2016.
 */

(function($,W,D)
{
    var JQueryValidation= {};

    JQueryValidation.UTIL =
    {
        setupFormValidation: function()
        {
            //form validation rules
            $("#loginForm").validate({
                ignore: ':hidden:not([class~=selectized]),:hidden > .selectized, .selectize-control .selectize-input input',
                rules: {
                    username: "required",
                    password: "required"
                },
                messages: {
                    username: "Please enter your username",
                    password: "Please enter your password"
                },
                submitHandler: function(form) {
                    form.submit();
                }
            });
        }
    };

    //when the dom has loaded setup form validation rules
    $(D).ready(function($) {
        JQueryValidation.UTIL.setupFormValidation();
    });

})(jQuery, window, document);