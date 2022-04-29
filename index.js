/**
 * Script for kpop shuffle web application.
 *
 * @author Erica H.
 */



// Sets user-agent
 Object.defineProperty(navigator, 'userAgent', {
    get: function () {
        var email = config.EMAIL;
        return 'kpop-shuffle/0.1.0 ( ' + email + ' )';
    }
});


/**
 * Randomly selects an element from an array
 * @param  {any[]}     array Array of elements
 * @return {any}       Selected element from array
 */
var randomizer = function (array) {
    let rand = array[Math.floor(Math.random() * array.length)];
    return rand;
};


/**
 * Reads files
 * @param {any} file     The file to be read
 * @param {any} callback 
 */
var read_file = function (file, callback) {

    // Check if the file is a URL
    if (file.includes("http")) {
        var request = new XMLHttpRequest();
        request.overrideMimeType("application/json");
        request.open("GET", file, true);
        request.onreadystatechange = function() {
            if (request.readyState == 4 && request.status == "200") {
                callback(request.responseText);
            } else if (file.includes("youtube") && request.status != "200") {
                callback(request.status);
            }
        }
        request.send();
    }

    // If file is not a URL (i.e. is an artist name), return the file
    else {
        callback(file)
    }
};


/**
 * Main function that processes the file and makes changes to the webpage
 * @param {any} file 
 */
var main_func = function (file) {

    // Call: get artist name from the file
    read_file(file, function(txt) {

        // If the artist name is received through a URL
        if (file.includes("http")) {
            var artist_list = String(txt);
            var artist_array = artist_list.split(",");
            var artist = randomizer(artist_array);
        }

        // If the artist name is received through text input
        else {
            var artist = file;
        }

        // Call: get the MusicBrainz ID of the artist
        read_file("https://beta.musicbrainz.org/ws/2/artist?query=" + encodeURIComponent(artist) + "&fmt=json", function(json) {
            var data = JSON.parse(json);
            for (i = 0; i < data.artists.length; ++i) {
                if (data.artists[i].country == "KR") {
                    var artist_ID = data.artists[i].id;
                    artist = data.artists[i].name;
                    console.log("Artist name: " + artist);
                    break;
                }
            }

            // Call: get track name
            read_file("https://beta.musicbrainz.org/ws/2/release?artist=" + artist_ID + "&inc=release-groups+recordings&fmt=json", function(json) {
                var data = JSON.parse(json);
                const unwanted = ['Interview', 'Live', 'DJ-mix'];
                var release_array = [];

                // Gather array of releases by the artist that do not have a release type included in 'unwanted'
                for (i = 0; i < data.releases.length; ++i) {
                    var secondary_type = data.releases[i]['release-group']['secondary-types'];
                    if (!secondary_type.some(type => unwanted.includes(type)) && data.releases[i].media.length != 0) {
                        release_array.push(data.releases[i]);
                    }
                }
                var release = randomizer(release_array);
                var track_array = [];

                // Gather array of tracks from the release
                for (i = 0; i < release.media[0].tracks.length; ++i) {
                    track_array.push(release.media[0].tracks[i].title);
                }
                var track = randomizer(track_array);

                // If "Don't show video" checkbox is ticked, then only show text result
                if (document.getElementById("vid_check").checked) {
                    var text = artist + " - " + track;
                    document.getElementById("txt").innerHTML = text;
                } else {
                    var youtube_key = config.API_KEY;

                    // Call: get YouTube video ID
                    read_file('https://youtube.googleapis.com/youtube/v3/search?part=snippet&q="' + encodeURIComponent(artist) + '" "' + encodeURIComponent(track) + '"&key=' + youtube_key, function(json) {
                        var data = JSON.parse(json);
                        try {
                            var vid_ID = data.items[0].id.videoId;
                            var embed = "https://www.youtube.com/embed/" + vid_ID;
                            var text = artist + " - " + track;
                            document.getElementById("vid").src = embed;
                            document.getElementById("txt").innerHTML = text;
                        } catch {
                            var text = artist + " - " + track;
                            document.getElementById("txt").innerHTML = text;
                        }
                    })
                }
            })
        })
    })
};


/**
 * Processes text inputs from the custom input box
 */
var on_input = function () {
    var input_text = document.getElementById("input").value;
    var yes = 0;

    // Ensuring that the input contains some alphanumeric values
    for (i = 0; i < input_text.length; ++i) {
        code = input_text.charCodeAt(i);
        if (!(code > 47 && code < 58) &&  // numeric (0-9)
            !(code > 64 && code < 91) &&  // upper alpha (A-Z)
            !(code > 96 && code < 123)) { // lower alpha (a-z)
            null;
        } else {
            yes = 1;
            break;
        }
    }
    if (yes == 1) {
        main_func(input_text);
    }
};


/**
 * Processes personalized results
 */
var on_search = function () {
    var search_text = document.getElementById("search").value;
    main_func("https://chewtle.github.io/kpop-shuffle-public/personalized/" + search_text + ".txt");
};


// Event listeners
window.addEventListener("DOMContentLoaded", function() {
    document.getElementById("vid").src = "";
});
document.getElementById("b_artist").addEventListener("click", function() {
    main_func("https://chewtle.github.io/kpop-shuffle-public/documents/artists.txt");
});
document.getElementById("b_popular").addEventListener("click", function() {
    main_func("https://chewtle.github.io/kpop-shuffle-public/documents/popular.txt");
});
document.getElementById("b_female").addEventListener("click", function() {
    main_func("https://chewtle.github.io/kpop-shuffle-public/documents/female.txt");
});
document.getElementById("b_male").addEventListener("click", function() {
    main_func("https://chewtle.github.io/kpop-shuffle-public/documents/male.txt");
});
document.getElementById("b_esoteric_all").addEventListener("click", function() {
    main_func("https://chewtle.github.io/kpop-shuffle-public/documents/esoteric_all.txt");
});
document.getElementById("b_esoteric_f").addEventListener("click", function() {
    main_func("https://chewtle.github.io/kpop-shuffle-public/documents/esoteric_f.txt");
});
document.getElementById("b_esoteric_m").addEventListener("click", function() {
    main_func("https://chewtle.github.io/kpop-shuffle-public/documents/esoteric_m.txt");
});
document.getElementById("b_input").addEventListener("click", on_input);
document.getElementById("input").addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
        on_input();
    }
});
document.getElementById("b_search").addEventListener("click", on_search);
document.getElementById("search").addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
        on_search();
    }
});
