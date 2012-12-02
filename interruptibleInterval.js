(function( $ ) {
    var timers = {};
    var settings = {};

    var methods = {
        set : function(timerId, options) {

            if ( timerId in timers ) {
                $.error( 'The timerId "' + timerId + '" already exists in interruptibleInterval.timers' );
            } else {

                var S = settings[timerId] = $.extend({
                            interruptInterval: 10000
                            }, options);

                if ( !('callback' in S) ) {
                    $.error( 'Missing required option "callback" in interruptibleInterval' );
                }
                if ( !('interval' in S) ) {
                    $.error( 'Missing required option "interval" in interruptibleInterval' );
                }

                timers[timerId] = window.setInterval( S.callback, S.interval );

                if ( 'interrupters' in S ) {
                    // bind events that interrupt the interval
                    // The user can provide a collection of jQuery objects, events, and interruptIntervals
                    for ( interrupter in S.interrupters ) {  
                        var i = S.interrupters[interrupter];
                        var obj = i.obj;
                        var e = i.e;
    
                        if ( !(obj instanceof jQuery) ) {
                            $.error( 'The interrupter "' + obj + '" is not a jQuery object' );
                        } else {
                            // If no interrupt interval is specified for an individual object, 
                            // the global interruptInterval is used
                            var interruptInterval;
                            if ( 'interruptInterval' in i ) { 
                                interruptInterval = i.interruptInterval; 
                            } else {
                                interruptInterval = S.interruptInterval;
                            }
    
                            // deal with namespacing potentially multiple events (space-separated in e)
                            e = e.split(' ')
                                 // append namespace to each event
                                 // (use timerId in namespace so we can unbind each timer individually
                                 .map(function(e) { return e+'.interruptibleInterval-'+timerId})
                                 // join 'em back up again
                                 .join(' ');
    
                            obj.bind(e, { tId: timerId, ii: interruptInterval }, 
                                    function(event) {
                                        methods.interrupt(event.data.tId, event.data.ii);
                                    });
                        }
                    }
                }
            }
        },

        interrupt : function(timerId, interruptInterval) {
            if ( !(timerId in timers) ) {
                $.error( 'Unknown timerId "' + timerId + '"' );
                return;
            }

            var S = settings[timerId];

            // stop the current interval timer
            window.clearInterval(timers[timerId]);

            // wait for the interruptInterval time before starting the interval timer again
            timers[timerId] = window.setInterval(function() {
                        window.clearInterval(timers[timerId]); 
                        timers[timerId] = window.setInterval( S.callback, S.interval );
                    },
                    interruptInterval);
            
        },
        
        clear : function (timerId) {
            if ( !(timerId in timers) ) {
                $.error( 'Unknown timerId "' + timerId + '"' );
                return;
            }

            window.clearInterval(timers[timerId]);
            delete timers[timerId];

            var S = settings[timerId];

            if ( 'interrupters' in S ) {
                // unbind the interval interruption events
                for ( interrupter in S.interrupters ) {  
                    var i = S.interrupters[interrupter];
                    var obj = i.obj;

                    if ( !(obj instanceof jQuery) ) {
                        $.error( 'The interrupter "' + obj + '" is not a jQuery object' );
                    } else {
                        obj.unbind('.interruptibleInterval-'+timerId);
                    }
                }
            }

            delete settings[timerId];
        }
    };

    $.fn.interruptibleInterval = function (method) {

        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( !method ) {
            $.error( 'You must specify an interruptibleInterval method (set, interrupt, or clear)' );
        } else {
            $.error( 'Method "' + method + '" does not exist on jQuery.interruptibleInterval' );
        }
    };
})( jQuery ); 
