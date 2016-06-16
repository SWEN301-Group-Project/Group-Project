/**
 * Created by davidthomsen on 7/06/16.
 */

chart = {
    initChartist: function (labels, series) {

        var labels = {
            labels: labels,
            series: series
        };

        var options = {
            seriesBarDistance: 10
        };

        var responsiveOptions = [
            ['screen and (max-width: 640px)', {
                seriesBarDistance: 5,
                axisX: {
                    labelInterpolationFnc: function (value) {
                        return value[0];
                    }
                }
            }]
        ];

        new Chartist.Bar('#chartKPS', labels, options, responsiveOptions);

    }
};