# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20170516131917) do

  create_table "genre_listings", force: :cascade do |t|
    t.integer  "genre_id"
    t.integer  "listing_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "genres", force: :cascade do |t|
    t.string   "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "genres_listings", id: false, force: :cascade do |t|
    t.integer "genre_id"
    t.integer "listing_id"
  end

  add_index "genres_listings", ["genre_id"], name: "index_genres_listings_on_genre_id"
  add_index "genres_listings", ["listing_id"], name: "index_genres_listings_on_listing_id"

  create_table "import_failures", force: :cascade do |t|
    t.string   "title"
    t.string   "year"
    t.string   "failed_attempt"
    t.datetime "created_at",     null: false
    t.datetime "updated_at",     null: false
  end

  create_table "listings", force: :cascade do |t|
    t.string   "title"
    t.string   "media_type"
    t.string   "location"
    t.string   "owner"
    t.datetime "created_at",                                                                                     null: false
    t.datetime "updated_at",                                                                                     null: false
    t.float    "imdb_rating", default: 0.0,                                                                      null: false
    t.float    "eg_rating"
    t.string   "year"
    t.integer  "runtime"
    t.text     "plot"
    t.string   "poster_url",  default: "http://www.lacinefest.org/uploads/2/6/7/4/26743637/no-poster_orig.jpeg"
    t.integer  "rt_rating",   default: 0,                                                                        null: false
    t.text     "notes"
    t.string   "imdb_id"
  end

  create_table "listings_people", id: false, force: :cascade do |t|
    t.integer "listing_id"
    t.integer "person_id"
  end

  add_index "listings_people", ["listing_id"], name: "index_listings_people_on_listing_id"
  add_index "listings_people", ["person_id"], name: "index_listings_people_on_person_id"

  create_table "people", force: :cascade do |t|
    t.string   "name"
    t.string   "role"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "person_listings", force: :cascade do |t|
    t.integer "person_id"
    t.integer "listing_id"
  end

end
