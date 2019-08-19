class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :null_session

  include GetData

  # send the user to the angular application by default
  def angular
    render "layouts/application", layout: false
  end
  
  def listings
    listings_array = Listing.all.to_json(:include => [:genres, :people])
    
    render :json => listings_array
  end
  
  def genres
    genres_array = Genre.all.to_json
    
    render :json => genres_array
  end
  
  def actors
    actors_array = Person.where(role: "actor").to_json
    
    render :json => actors_array
  end
  
  def directors
    directors_array = Person.where(role: "director").to_json
    
    render :json => directors_array
  end
  
  def writers
    writers_array = Person.where(role: "writer").to_json
    
    render :json => writers_array
  end
  
  def failures
    failures_array = ImportFailure.all.to_json
    
    render :json => failures_array
  end
  
  def delete_listing
    Listing.find(params['id']).destroy
    
    head :no_content
  end
  
  def delete_failure
    ImportFailure.find(params['id']).destroy
    
    head :no_content
  end
  
  def delete_all_failures
    ImportFailure.destroy_all
    
    head :no_content
  end
  
  def add_rating
    l = Listing.find(params['id'])
    l.update(imdb_rating: params['imdb_rating'])
    
    render :json => "success"
  end
  
  def add_listing
    l = Listing.where(params.except('genres', 'actors', 'directors', 'location', 'owner', 'controller', 'action', 'application', 'imdb_rating', 'rt_rating', 'notes', 'writers', 'runtime').symbolize_keys).first_or_initialize
    if l.location.nil?
      l.location = params['location']
    else
      l.location = "#{l.location}, #{params['location']}" unless l.location.include?(params['location'])
    end
    if l.owner.nil?
      l.owner = params['owner']
    else
      l.owner = "#{l.owner}, #{params['owner']}" unless l.owner.include?(params['owner'])
    end
    l.imdb_rating = params['imdb_rating']
    l.rt_rating = params['rt_rating']
    l.runtime = params['runtime']
    l.notes = params['notes']
    if l.save
      unless params['genres'].nil?
        genres = params['genres'].split(", ")
        genres.each { |g| genre = Genre.where(name: g).first_or_create; l.genres << genre unless l.genres.include?(genre) }
      end
      unless params['actors'].nil?
        actors = params['actors'].split(", ")
        actors.each { |a| actor = Person.where(name: a, role: "actor").first_or_create; l.people << actor unless l.people.include?(actor) }
      end
      unless params['directors'].nil?
        directors = params['directors'].split(", ")
        directors.each { |d| director = Person.where(name: d, role: "director").first_or_create; l.people << director unless l.people.include?(director) }
      end
      unless params['writers'].nil?
        writers = params['writers'].split(", ")
        writers.each { |w| writer = Person.where(name: w, role: "writer").first_or_create; l.people << writer unless l.people.include?(writer) }
      end
      
      render :json => {'success' => true }
    else
      render :json => {'success' => false }
    end
  end
  
  def edit_listing
    g = Genre.all
    a = Person.where(role: "actor")
    d = Person.where(role: "director")
    w = Person.where(role: "writer")
    # find relevant Listing
    l = Listing.find(params['id'])
    # set parameters for updating
    title = params['title']
    genres = params['genres'].split(", ")
    actors = params['actors'].split(", ")
    directors = params['directors'].split(", ")
    writers = params['writers'].split(", ")
    media_type = params['media_type']
    location = params['location']
    owner = params['owner']
    imdb_rating = params['imdb_rating']
    rt_rating = params['rt_rating']
    year = params['year']
    runtime = params['runtime']
    plot = params['plot']
    poster_url = params['poster_url']
    notes = params['notes']
    imdb_id = params['imdb_id']
    
    # update all non-associative fields
    l.update(title: title, media_type: media_type, location: location, owner: owner, imdb_rating: imdb_rating, rt_rating: rt_rating, year: year, runtime: runtime, plot: plot, poster_url: poster_url, notes: notes, imdb_id: imdb_id)
    # update associatiations
    l_genres = l.genres.map { |gen| gen.name }
    l_actors = l.people.where(role: "actor").map { |act| act.name }
    l_directors = l.people.where(role: "director").map { |dir| dir.name }
    l_writers = l.people.where(role: "writer").map { |wri| wri.name }
    
    # find add/removes of each association
    remove_genres = l_genres - genres
    add_genres = genres - l_genres
    remove_actors = l_actors - actors
    add_actors = actors - l_actors
    remove_directors = l_directors - directors
    add_directors = directors - l_directors
    remove_writers = l_writers - writers
    add_writers = writers - l_writers
    
    # add/remove each association
    
    # genres
    if !remove_genres.empty?
      r_g_ids = remove_genres.map { |rg| g.find_by(name: rg).id }
      r_g_ids.each { |rg| l.genres.delete(rg) }
    end
    if !add_genres.empty?
      add_genres.each { |ag| a_g = g.where(name: ag).first_or_create; l.genres << a_g }
    end
    
    # actors
    if !remove_actors.empty?
      r_a_ids = remove_actors.map { |ra| a.find_by(name: ra, role: "actor").id }
      r_a_ids.each { |ra| l.people.delete(ra) }
    end
    if !add_actors.empty?
      add_actors.each { |aa| a_a = a.where(name: aa, role: "actor").first_or_create; l.people << a_a }
    end
    
    # directors
    if !remove_directors.empty?
      r_d_ids = remove_directors.map { |rd| d.find_by(name: rd, role: "director").id }
      r_d_ids.each { |rd| l.people.delete(rd) }
    end
    if !add_directors.empty?
      add_directors.each { |ad| a_d = d.where(name: ad, role: "director").first_or_create; l.people << a_d }
    end
    
    # writers
    if !remove_writers.empty?
      r_w_ids = remove_writers.map { |rw| w.find_by(name: rw, role: "writer").id }
      r_w_ids.each { |rw| l.people.delete(rw) }
    end
    if !add_writers.empty?
      add_writers.each { |aw| a_w = w.where(name: aw, role: "writer").first_or_create; l.people << a_w }
    end
    
    render :json => {'success' => true }
  end
  
  def import_listing
    Listing.import_single_listing(params['imdb_id'], params['search_title'], params['display_title'], params['year'], params['media'], params['season'], params['location'], params['owner'], params['notes'], params['holiday'])
    render :json => {'success' => true }
  end
  
  def upload_file
    ##### format: #####
    # header row
    # season, title, year, owner, holiday, form, notes, series, imdb_id
    file = params["file"]
    spreadsheet = Roo::Excelx.new(file.path)
    
    # cycle through each row of the spreadsheet (after the header)
    range = 2..spreadsheet.last_row
    range.each do |i|
      row = spreadsheet.row(i)
      row[0].nil? ? season = "" : season = row[0]
      title = row[1]
      year = row[2]
      owner = row[3]
      row[4].nil? ? holiday = "" : holiday = row[4]
      form = row[5]
      notes = row[6]
      row[7].nil? ? series = "" : series = row[7]
      imdb_id = row[89]
      
      if season.blank? 
        media = "movie" 
      elsif season.to_s.match(/S\d{2}E\d{2}/)
        media = "episode"
      else
        media = "series"
      end
      
      next if i == 0
      listing = Listing.xl_import_listing(title, year, media, imdb_id, { 'season' => season, 'owner' => owner, 'holiday' => holiday, 'form' => form, 'notes' => notes, 'series' => series })
    end
    render :json => {'success' => true }
  end

  def authenticate
    if params['password'] != ENV['IOPASSWORD']
      head :forbidden
      return true
    else
      render status: 200, json: {'success' => true }
    end
  end
  
  # def charts
  #   puts "====="
  #   render :json => "abc"
  # end

  def get_episode_data
    puts "====abc"
    data_hash = get_episode_info(params['imdb_id'])

    render :json => data_hash
  end

  private
  
  def listing_params
    params.require(:listing).permit(:title, :media_type, :location, :owner, :imdb_rating, :rt_rating, :year, :runtime, :plot, :poster_url, :notes, :imdb_id, :password)
  end
end
