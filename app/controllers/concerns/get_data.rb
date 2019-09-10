#./app/controllers/concerns/get_data.rb
module GetData
	extend ActiveSupport::Concern

	def get_episode_info(imdb_id)
    def episode_data(data)
      output = []
      season_base = data.css('#episode_top').text.match(/Season\p{Zs}(.*)/)
      return "invalid season" if season_base.nil? # skip if season doesn't parse correctly
      season = season_base[1]
      episodes = data.css('.list_item')
      episodes.each do |ep|
        info = ep.css('.info')
        ep_data = {}
        ep_data['season'] = season
        ep_data['ep_number'] = info.css('meta').attr('content').value
        ep_data['title'] = info.css('strong').text
        ep_data['imdb_id'] = info.css('strong').css('a').attr('href').value.match(/tt\d{1,10}/)[0]
        air_date_reg = info.css('.airdate')[0].text.match(/\d{1,2}\s[A-Za-z]{3}\.?\s\d{4}/)
        if air_date_reg.nil?
          # break if no date is listed
          return "break"
        end
        air_date_raw = air_date_reg[0].gsub(".", "")
        air_date = DateTime.strptime(air_date_raw, "%d %b %Y").strftime("%F")
        if air_date > Date.today.strftime("%F")
          # break if date is in the future
          return "break"
        end
        ep_data['air_date'] = air_date
        ep_data['rating'] = info.css('.ipl-rating-star.small .ipl-rating-star__rating').text
        output << ep_data
      end

      return output
    end

    output = {}

		agent = Mechanize.new

    # first season and set seasons
    response = agent.get("https://www.imdb.com/title/#{imdb_id}/episodes/_ajax?season=1")
    s_list = response.css('#bySeason')
    sel = s_list.css('[selected=selected]')[0].attr('value')
    seasons = s_list.css('option').map { |o| o.attr('value') }

    ep_data = episode_data(response)

    output[sel] = ep_data.map { |ep| {"Title" => ep["title"], "Released" => ep["air_date"], "Episode" => ep["ep_number"], "imdbRating" => ep["rating"], "imdbId" => ep["imdb_id"]} }

    # get data for each other season
    (seasons - [sel]).each do |season|
      response = agent.get("https://www.imdb.com/title/#{imdb_id}/episodes/_ajax?season=#{season}")
      
      ep_data = episode_data(response)
      if ep_data == "break"
        break
      elsif ep_data == "invalid season"
        next
      else
        output[season] = ep_data.map { |ep| {"Title" => ep["title"], "Released" => ep["air_date"], "Episode" => ep["ep_number"], "imdbRating" => ep["rating"], "imdbId" => ep["imdb_id"]} }
      end
    end

    return output
	end
end