/**
 * Created by harmansingh on 16/06/16.
 */

(function($,W,D)
{
    var JQueryValidation= {};

    JQueryValidation.UTIL =
    {
        setupFormValidation: function()
        {
            //form validation rules
            $("#priceUpdate").validate({
                ignore: ':hidden:not([class~=selectized]),:hidden > .selectized, .selectize-control .selectize-input input',
                rules: {
                    origin: "required",
                    destination: {
                        required:true,
                        notEqual: "#origin",
                    },
                    weightcost: {
                        required: true,
                        greaterThanZero : true
                    },
                    volumecost: {
                        required: true,
                        greaterThanZero: true,
                    }
                },
                messages: {
                    origin: "Please choose origin from list",
                    destination: {
                        required: "Please choose destination from list",
                        notEqual: "Destination must be different from origin"
                    },
                    weightcost: {
                        required: "Please provide a weight cost",
                        greaterThanZero: "Weight cost must be greater than 0"
                    },
                    volumecost: {
                        required: "Please provide a volume cost",
                        greaterThanZero: "Volume cost must be greater than 0"
                    }
                },
                submitHandler: function(form) {
                    form.submit();
                }
            });
        }
    };

    jQuery.validator.addMethod("greaterThanZero", function(value, element) {
        return this.optional(element) || (parseFloat(value) > 0);
    }, "* Amount must be greater than zero");

    jQuery.validator.addMethod("notEqual", function(value, element, param) {
        console.log($(param).val());
        return this.optional(element) || value.toLowerCase() != $(param).val().toLowerCase();
    }, "Value must be different");

    //when the dom has loaded setup form validation rules
    $(D).ready(function($) {
        JQueryValidation.UTIL.setupFormValidation();
    });

})(jQuery, window, document);

