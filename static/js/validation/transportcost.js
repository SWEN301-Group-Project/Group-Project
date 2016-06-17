/**
 * Created by harmansingh on 29/05/16.
 */
(function($,W,D)
{
    var JQueryValidation= {};

    JQueryValidation.UTIL =
    {
        setupFormValidation: function()
        {
            //form validation rules
            $("#costUpdate").validate({
                ignore: ':hidden:not([class~=selectized]),:hidden > .selectized, .selectize-control .selectize-input input',
                rules: {
                    sourceLocation: "required",
                    destLocation: {
                        required:true,
                        notEqual: "#sourceLocation",
                    },
                    company: {
                        required: true
                    },
                    weightCost: {
                        required: true,
                        greaterThanZero : true
                    },
                    volumeCost: {
                        required: true,
                        greaterThanZero: true,
                    },
                    weightLimit: {
                        required: true,
                        greaterThanZero : true
                    },
                    volumeLimit: {
                        required: true,
                        greaterThanZero: true,
                    },
                    frequency: {
                        required: true,
                        greaterThanZero : true
                    },
                    duration: {
                        required: true,
                        greaterThanZero: true,
                    }
                },
                messages: {
                    sourceLocation: "Please choose origin from list",
                    destLocation: {
                        required: "Please choose destination from list",
                        notEqual: "Destination must be different from origin"
                    },
                    company: {
                        required: "Please choose a company from the list"
                    },
                    weightCost: {
                        required: "Please provide a weight cost",
                        greaterThanZero: "Weight cost must be greater than 0"
                    },
                    volumeCost: {
                        required: "Please provide a volume cost",
                        greaterThanZero: "Volume cost must be greater than 0"
                    },
                    weightLimit: {
                        required: "Please provide a weight limit",
                        greaterThanZero: "Weight limit must be greater than 0"
                    },
                    volumeLimit: {
                        required: "Please provide a volume limit",
                        greaterThanZero: "Volume limit must be greater than 0"
                    },
                    frequency: {
                        required: "Please provide a departure frequency",
                        greaterThanZero: "Departure frequency must be greater than 0"
                    },
                    duration: {
                        required: "Please provide a transport duration",
                        greaterThanZero: "Transport duration must be greater than 0"
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
