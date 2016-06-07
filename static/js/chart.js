/**
 * Created by davidthomsen on 7/06/16.
 */

chart = {
    initChartist: function (labels, series) {

        var labels = {
            labels: labels,
            series: series
            //labels: ['9:00AM', '12:00AM', '3:00PM', '6:00PM', '9:00PM', '12:00PM', '3:00AM', '6:00AM'],
            //series: [
            //    [287, 385, 490, 562, 594, 626, 698, 895, 952],
            //    [67, 152, 193, 240, 387, 435, 535, 642, 744],
            //    [23, 113, 67, 108, 190, 239, 307, 410, 410]
            //]
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