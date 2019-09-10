class AddRatings < ActiveRecord::Migration
  def change
    add_column :listings, :imdb_rating, :float, :default => 0, :null => false
    add_column :listings, :eg_rating, :float, :default => 0, :null => false
  end
end
