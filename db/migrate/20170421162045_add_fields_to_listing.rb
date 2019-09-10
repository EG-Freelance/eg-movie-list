class AddFieldsToListing < ActiveRecord::Migration
  def change
    add_column :listings, :year, :string
    add_column :listings, :runtime, :integer
    add_column :listings, :plot, :text
    add_column :listings, :poster_url, :text, :default => "http://www.lacinefest.org/uploads/2/6/7/4/26743637/no-poster_orig.jpeg"
    add_column :listings, :rt_rating, :integer, :null => false, :default => 0
  end
end
