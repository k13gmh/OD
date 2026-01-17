/**
 * File: timed.js
 * Version: 1.0.5
 */

(function() {
    'use strict';

    const TimedEvents = {
        version: "1.0.5",
        activeTimers: {},

        /**
         * Initializes a countdown.
         * @param {string} id - Unique identifier for the timer.
         * @param {number} seconds - Duration in seconds.
         * @param {function} onComplete - Callback function when time expires.
         */
        startTimer: function(id, seconds, onComplete) {
            if (this.activeTimers[id]) {
                clearInterval(this.activeTimers[id]);
            }

            let timeLeft = seconds;

            this.activeTimers[id] = setInterval(() => {
                timeLeft--;
                
                if (timeLeft <= 0) {
                    this.stopTimer(id);
                    if (typeof onComplete === 'function') {
                        onComplete();
                    }
                }
            }, 1000);
        },

        /**
         * Stops and clears a specific timer.
         * @param {string} id - The ID of the timer to stop.
         */
        stopTimer: function(id) {
            if (this.activeTimers[id]) {
                clearInterval(this.activeTimers[id]);
                delete this.activeTimers[id];
            }
        },

        /**
         * Check if a specific timer is currently running.
         */
        isActive: function(id) {
            return !!this.activeTimers[id];
        }
    };

    window.TimedEvents = TimedEvents;
})();
