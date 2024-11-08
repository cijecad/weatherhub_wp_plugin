jQuery(document).ready(function($) {
    // Fetch weather stations via AJAX
    $.ajax({
        url: weatherGraphSettings.ajax_url,
        method: 'POST',
        data: {
            action: 'fetch_weather_stations_for_graph'
        },
        success: function(response) {
            console.log('Stations AJAX response:', response);
            if (response.success) {
                var stations = response.data;
                var $weatherStationSelect = $('#weather-station');

                // Populate the dropdown with weather stations
                stations.forEach(function(station) {
                    var option = $('<option></option>')
                        .attr('value', station.station_id)
                        .text(station.station_name);
                    $weatherStationSelect.append(option);
                });
            } else {
                console.error('Failed to fetch weather stations:', response.data);
            }
        },
        error: function(error) {
            console.error('Stations AJAX error:', error);
        }
    });

    // Function to parse date strings into Date objects
    function parseDateString(dateString) {
        var parts = dateString.split(/[- :]/);
        return new Date(
            parseInt(parts[0], 10), // Year
            parseInt(parts[1], 10) - 1, // Month (0-based)
            parseInt(parts[2], 10), // Day
            parseInt(parts[3], 10), // Hour
            parseInt(parts[4], 10), // Minute
            parseInt(parts[5], 10) // Second
        );
    }

    // Fetch weather data and render the graph
    function fetchWeatherDataAndRenderGraph() {
        var stationId = $('#weather-station').val();
        var measure = $('#y-axis-measure').val();
        var timeRange = $('#time-range').val();

        if (!stationId || !measure || !timeRange) {
            return;
        }

        $.ajax({
            url: weatherGraphSettings.ajax_url,
            method: 'POST',
            data: {
                action: 'fetch_weather_data_for_graph',
                station_id: stationId,
                measure: measure,
                time_range: timeRange
            },
            success: function(response) {
                console.log('Weather data AJAX response:', response);

                if (response.success && response.data.length > 0) {
                    var weatherData = response.data;
                    console.log('Fetched weather data:', weatherData);

                    var labels = [];
                    var values = [];

                    // Process the data
                    for (var i = 0; i < weatherData.length; i++) {
                        var dateStr = weatherData[i].date_time;
                        var valueStr = weatherData[i][measure];

                        // Parse the date string into a Date object
                        var dateObj = parseDateString(dateStr);

                        // Parse the value into a float
                        var valueNum = parseFloat(valueStr);

                        // Add to arrays if valid
                        if (!isNaN(dateObj.getTime()) && !isNaN(valueNum)) {
                            labels.push(dateObj);
                            values.push(valueNum);
                        } else {
                            console.warn('Invalid data point:', dateStr, valueStr);
                        }
                    }

                    console.log('Processed Labels:', labels);
                    console.log('Processed Values:', values);

                    // Display data for debugging
                    $('#debug-output').html(
                        '<p>Labels: ' + labels.join(', ') + '</p>' +
                        '<p>Values: ' + values.join(', ') + '</p>'
                    );

                    // Clear the previous chart instance if it exists
                    if (window.myChart) {
                        window.myChart.destroy();
                    }

                    // Render the graph using Chart.js
                    var ctx = document.getElementById('weather-graph').getContext('2d');
                    window.myChart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: measure,
                                data: values,
                                borderColor: 'rgba(75, 192, 192, 1)',
                                borderWidth: 2,
                                fill: false,
                                tension: 0.1
                            }]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                x: {
                                    type: 'time',
                                    time: {
                                        unit: 'day',
                                        tooltipFormat: 'MMM dd, yyyy HH:mm:ss'
                                    },
                                    title: {
                                        display: true,
                                        text: 'Date'
                                    }
                                },
                                y: {
                                    title: {
                                        display: true,
                                        text: measure
                                    }
                                }
                            },
                            plugins: {
                                legend: {
                                    display: true
                                },
                                tooltip: {
                                    enabled: true
                                }
                            }
                        }
                    });
                } else {
                    console.warn('No data available for the selected time range.');
                    $('#debug-output').html('<p>No data available for the selected time range.</p>');
                    if (window.myChart) {
                        window.myChart.destroy();
                    }
                }
            },
            error: function(error) {
                console.error('Weather data AJAX error:', error);
            }
        });
    }

    // Add a div for debug output
    $('<div id="debug-output"></div>').insertAfter('#weather-graph');

    // Event listeners for dropdown changes
    $('#weather-station, #y-axis-measure, #time-range').change(fetchWeatherDataAndRenderGraph);

    // Initial call to render the graph with default values
    fetchWeatherDataAndRenderGraph();
});