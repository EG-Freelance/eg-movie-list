class Listing < ActiveRecord::Base
  has_many :genre_listings, dependent: :destroy
  has_many :genres, :through => :genre_listings
  has_many :person_listings, dependent: :destroy
  has_many :people, :through => :person_listings
  
  def self.xl_import_listing(title, year, media, imdb_id, xl_data) # media must be 'movie', 'series', or 'episode'
    # xl_data = { 'season' => season, 'owner' => owner, 'holiday' => holiday, 'form' => form, 'notes' => notes, 'series' => series }
    
    if imdb_id.nil?
      title = title.to_s
      if title.match(/\, The\z/)
        search_title = "The " + title.gsub(/\, The\z/,"")
      elsif title.match(/\, A\z/)
        search_title = "A " + title.gsub(/\, A\z/,"")
      elsif title.match(/\, An\z/)
        search_title = "An " + title.gsub(/\, An\z/,"")
      else
        search_title = title
      end
      year = year.to_s
      # get information from OMDb API
      puts "getting information from OMDb API for #{title} - #{year}..."
      if media == "movie" || media == "series"
        url = "http://www.omdbapi.com/?apikey=#{ENV['API_KEY']}&#{URI.encode_www_form({ 't' => search_title, 'y' => year, 'type' => media }) }"
      else
        season_data = xl_data["season"].match(/S(\d{2})E(\d{2})/)
        season = season_data[1]
        episode = season_data[2]
        url = "http://www.omdbapi.com/?apikey=#{ENV['API_KEY']}&#{URI.encode_www_form('t' => search_title) }&Season=#{season}&Episode=#{episode}"
      end
    else
      url = "http://www.omdbapi.com/?apikey=#{ENV['API_KEY']}&i=#{imdb_id}"
    end

    begin
      response = Curl.get(url)
      data = response.body
      hash = JSON.parse(data)
    
      if hash["Response"] == "False"
        puts "Could not find listing"
        raise
      end
    rescue
      if url == "http://www.omdbapi.com/?apikey=#{ENV['API_KEY']}&#{URI.encode_www_form('t' => search_title) }&#{URI.encode_www_form('y' => year) }&#{URI.encode_www_form('type' => media)}"
        puts "#{title} - #{year} failed using year, trying without year...."
        url = "http://www.omdbapi.com/?apikey=#{ENV['API_KEY']}&#{URI.encode_www_form('t' => search_title) }&#{URI.encode_www_form('type' => media)}"
        ImportFailure.create(title: search_title, year: year, failed_attempt: "1")
        retry
      elsif url == "http://www.omdbapi.com/?apikey=#{ENV['API_KEY']}&i=#{imdb_id}"
        puts "could not find record by imdb_id; please check the ID again"
        ImportFailure.create(title: "No title: id #{imdb_id}", failed_attempt: "2")
        return false
      else
        puts "could not find record; aborting!"
        ImportFailure.create(title: search_title, year: year, failed_attempt: "2")
        #### For now, don't automatically save entries with failures; that can likely be done manually
        # listing = Listing.where(title: title, year: xl_data["year"], runtime: "N/A").first_or_create
        # listing.update(
        #   media_type: "N/A",
        #   notes: xl_data["notes"],
        #   location: xl_data['form'],
        #   owner: xl_data['owner'], 
        #   plot: "N/A", 
        #   poster_url: "N/A",
        #   imdb_id: "N/A"
        # )
        return false
      end
    end
    
    # find or create movie listing
    
    puts "finding/creating movie listing..."

    if xl_data['season'].blank?
      season = ""
      runtime = hash["Runtime"]
      type = "Movie"
    elsif media == "episode"
      type = "Episode"
      runtime = hash["Runtime"]
      season = " (" + xl_data['season'] + ")"
    else
      season_s = xl_data['season'].to_s
      type = "TV"
      runtime = ""
      if season_s.to_s.match(/\A\d*\z/)
        if season_s.to_s.length == 1
          season = " (S0" + season_s + ")"
        else
          season = " (S" + season_s + ")"
        end
      else
        season = " (" + season_s + ")"
      end
    end
    
    series = xl_data['series']
    notes = xl_data['notes']
    
    title = series + title + season
    
    listing = Listing.where(title: title, year: hash["Year"], runtime: runtime).first_or_create # include runtime to prevent overwriting rare cases (e.g. 2009 Emma)
    
    # add owners
    if listing.owner.nil?
      owner = xl_data['owner']
    else
      listing.owner.include?(xl_data['owner']) ? owner = listing.owner : owner = listing.owner + ", " + xl_data['owner']
    end
    
    # add locations
    if listing.location.nil?
      location = xl_data['form']
    else
      listing.location.include?(xl_data['form']) ? location = listing.location : location = listing.location + ", " + xl_data['form']
    end
    
    # add notes
    if !notes.nil?
      if !listing.notes.nil?
        listing.notes.include?(notes) ? notes = listing.notes : notes = listing.notes + "; " + notes
      end
    end
    
    # add ratings if they exist
    if hash["Ratings"].nil?
      if hash["imdbRating"].nil?
        imdb_rating = 0
      else
        imdb_rating = hash["imdbRating"]
      end
      rt_rating = 0
    else
      hash["Ratings"].find { |r| r["Source"] == "Internet Movie Database" }.nil? ? imdb_rating = 0 : imdb_rating = hash["Ratings"].find { |r| r["Source"] == "Internet Movie Database" }["Value"]
      hash["Ratings"].find { |r| r["Source"] == "Rotten Tomatoes" }.nil? ? rt_rating = 0 : rt_rating = hash["Ratings"].find { |r| r["Source"] == "Rotten Tomatoes" }["Value"].to_i
    end
    
    # update listing with all updated params
    listing.update(
      media_type: type,
      notes: notes,
      location: location,
      owner: owner, 
      plot: hash["Plot"], 
      poster_url: hash["Poster"],
      imdb_id: hash["imdbID"],
      imdb_rating: imdb_rating,
      rt_rating: rt_rating
    )
    
    # generate and associate peripheral data
    genres = hash["Genre"].split(", ")
    # add holiday genre
    holidays = xl_data["holiday"].split(/; ?/)
    if !holidays.blank?
      holidays.each { |h| genres.push(h) }
    end
    # genres.push(xl_data["holiday"]) unless xl_data["holiday"].blank?
    directors = hash["Director"].split(", ")
    w_string = hash["Writer"].gsub(/\s?\(.*\)\s?/,"") # need to remove roles from writer names BEFORE splitting (to avoid comma parentheticals)
    writers = w_string.split(", ")
    actors = hash["Actors"].split(", ")
    
    puts "finding, creating, and associating genres..."
    genres.each { |genre| g = Genre.where(name: genre).first_or_create; listing.genres << g unless listing.genres.include?(g) }
    puts "finding, creating, and associating directors..."
    directors.each { |director| d = Person.where(name: director, role: "director").first_or_create; listing.people << d unless listing.people.include?(d) }
    puts "finding, creating, and associating writers..."
    writers.each { |writer| w = Person.where(name: writer, role: "writer").first_or_create; listing.people << w unless listing.people.include?(w) }
    puts "finding, creating, and associating actors..."
    actors.each { |actor| a = Person.where(name: actor, role: "actor").first_or_create; listing.people << a unless listing.people.include?(a) }
    puts "complete!"
  end
  
  def self.import_single_listing(imdb_id, search_title, display_title, year, media, season_str, location, owner, notes, holiday)
    if imdb_id.nil?
      year = year.to_s
      # get information from OMDb API
      puts "getting information from OMDb API for #{search_title} - #{year}..."
      if media == "movie" || media == "series"
        url = "http://www.omdbapi.com/?apikey=#{ENV['API_KEY']}&#{URI.encode_www_form('t' => search_title) }&#{URI.encode_www_form('y' => year) }&#{URI.encode_www_form('type' => media)}"
      else
        season_data = season_str.match(/S(\d{2})E(\d{2})/)
        season = season_data[1]
        episode = season_data[2]
        url = "http://www.omdbapi.com/?apikey=#{ENV['API_KEY']}&#{URI.encode_www_form('t' => search_title) }&Season=#{season}&Episode=#{episode}"
      end
    else
      url = "http://www.omdbapi.com/?apikey=#{ENV['API_KEY']}&i=#{imdb_id}"
    end

    begin
      response = Curl.get(url)
      data = response.body
      hash = JSON.parse(data)
    
      if hash["Response"] == "False"
        puts "Could not find listing"
        raise
      end
    rescue
      if url == "http://www.omdbapi.com/?apikey=#{ENV['API_KEY']}&#{URI.encode_www_form('t' => search_title) }&#{URI.encode_www_form('y' => year) }&#{URI.encode_www_form('type' => media)}"
        puts "#{search_title} - #{year} failed using year, trying without year...."
        url = "http://www.omdbapi.com/?apikey=#{ENV['API_KEY']}&#{URI.encode_www_form('t' => search_title) }&#{URI.encode_www_form('type' => media)}"
        ImportFailure.create(title: search_title, year: year, failed_attempt: "1")
        retry
      elsif url == "http://www.omdbapi.com/?apikey=#{ENV['API_KEY']}&i=#{imdb_id}"
        puts "could not find record by imdb_id; please check the ID again"
        ImportFailure.create(title: "No title: id #{imdb_id}", failed_attempt: "2")
        return false
      else
        puts "could not find record; aborting!"
        ImportFailure.create(title: search_title, year: year, failed_attempt: "2")
        return false
      end
    end
    
    # find or create movie listing
    
    puts "finding/creating movie listing..."

    if season_str.blank? || season_str.nil?
      season = ""
      runtime = hash["Runtime"]
      type = "Movie"
    elsif media == "episode"
      type = "Episode"
      runtime = hash["Runtime"]
      season = " (" + season_str + ")"
    else
      season = " (" + season_str + ")"
      type = "TV"
      runtime = ""
    end
    
    title = display_title + season
    
    listing = Listing.where(title: title, year: hash["Year"], runtime: runtime).first_or_create # include runtime to prevent overwriting rare cases (e.g. 2009 Emma)
    
    # add owners
    unless listing.owner.nil?
      listing.owner.include?(owner) ? owner = listing.owner : owner = listing.owner + ", " + owner
    end
    
    # add locations
    unless listing.location.nil?
      listing.location.include?(location) ? location = listing.location : location = listing.location + ", " + location
    end
    
    # add notes
    if !notes.nil?
      if !listing.notes.nil?
        listing.notes.include?(notes) ? notes = listing.notes : notes = listing.notes + "; " + notes
      end
    end
    
    # add ratings if they exist
    if hash["Ratings"].nil?
      if hash["imdbRating"].nil?
        imdb_rating = 0
      else
        imdb_rating = hash["imdbRating"]
      end
      rt_rating = 0
    else
      hash["Ratings"].find { |r| r["Source"] == "Internet Movie Database" }.nil? ? imdb_rating = 0 : imdb_rating = hash["Ratings"].find { |r| r["Source"] == "Internet Movie Database" }["Value"]
      hash["Ratings"].find { |r| r["Source"] == "Rotten Tomatoes" }.nil? ? rt_rating = 0 : rt_rating = hash["Ratings"].find { |r| r["Source"] == "Rotten Tomatoes" }["Value"].to_i
    end
    
    # update listing with all updated params
    listing.update(
      media_type: type,
      notes: notes,
      location: location,
      owner: owner, 
      plot: hash["Plot"], 
      poster_url: hash["Poster"],
      imdb_id: hash["imdbID"],
      imdb_rating: imdb_rating,
      rt_rating: rt_rating
    )
    
    # generate and associate peripheral data
    genres = hash["Genre"].split(", ")
    # add holiday genre
    holidays = holiday.split(/; ?/) unless holiday.nil?
    if !holidays.blank?
      holidays.each { |h| genres.push(h) }
    end
    # genres.push(holiday) unless holiday.blank?
    directors = hash["Director"].split(", ")
    writers = hash["Writer"].split(", ")
    writers = writers.each { |w| w.gsub!(/\s?\(.*\)\s?/,"") }.uniq # need to remove roles from writer names
    actors = hash["Actors"].split(", ")
    
    puts "finding, creating, and associating genres..."
    genres.each { |genre| g = Genre.where(name: genre).first_or_create; listing.genres << g unless listing.genres.include?(g) }
    puts "finding, creating, and associating directors..."
    directors.each { |director| d = Person.where(name: director, role: "director").first_or_create; listing.people << d unless listing.people.include?(d) }
    puts "finding, creating, and associating writers..."
    writers.each { |writer| w = Person.where(name: writer, role: "writer").first_or_create; listing.people << w unless listing.people.include?(w) }
    puts "finding, creating, and associating actors..."
    actors.each { |actor| a = Person.where(name: actor, role: "actor").first_or_create; listing.people << a unless listing.people.include?(a) }
    puts "complete!"

  end
  
  def self.clean_posters
    url = "http://www.omdbapi.com/?apikey=#{ENV['API_KEY']}&i="
    Listing.where.not(imdb_id: nil).each do |l|
      response = Curl.get(l.poster_url)
      if response.body.match("404 Not Found")
        if l.imdb_id.nil?
          next
        end
        response = Curl.get(url + l.imdb_id)
        l.update(poster_url: JSON.parse(response.body)["Poster"])
      end
    end
  end
end