class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :null_session
  
  # send the user to the angular application by default
  def angular
    render "layouts/application", layout: false
  end
  
  def listings
    listings_array = JSON.parse(Listing.all.to_json)
    listings_array.each do |l| 
      listing = Listing.find(l["id"])
      !listing.genres.empty? ? l["genres"] = listing.genres.map { |g| g.name } : l["genres"] = ["Empty"]
      !listing.people.select { |p| p.role == "actor" }.empty? ? l["actors"] = listing.people.map { |p| p.name if p.role == "actor" }.compact : l["actors"] = ["Empty"]
      !listing.people.select { |p| p.role == "director" }.empty? ? l["directors"] = listing.people.map { |p| p.name if p.role == "director" }.compact : l["directors"] = ["Empty"]
    end
    
    render :json => listings_array.to_json
  end
  
  def add_listing
    l = Listing.where(params.except('genres', 'actors', 'directors', 'controller', 'action', 'application').symbolize_keys).first_or_initialize
    if l.save
      unless params['genres'].nil?
        genres = params['genres'].split(", ")
        genres.each { |g| genre = Genre.where(name: g).first_or_create; l.genres << genre }
      end
      unless params['actors'].nil?
        actors = params['actors'].split(", ")
        actors.each { |a| actor = Person.where(name: a, role: "actor").first_or_create; l.people << actor }
      end
      unless params['directors'].nil?
        directors = params['directors'].split(", ")
        directors.each { |d| director = Person.where(name: d, role: "director").first_or_create; l.people << director }
      end
      render :json => {'success' => true }
    else
      render :json => {'success' => false }
    end
  end
  
  private
  
  def listing_params
    params.require(:listing).permit(:title, :media_type, :location, :owner)
  end
end
