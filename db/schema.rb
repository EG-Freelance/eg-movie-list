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

ActiveRecord::Schema.define(version: 20170423204134) do

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
    t.datetime "created_at",  null: false
    t.datetime "updated_at",  null: false
    t.float    "imdb_rating"
    t.float    "eg_rating"
    t.string   "year"
    t.integer  "runtime"
    t.text     "plot"
    t.text     "poster_url"
    t.string   "rt_rating"
    t.text     "notes"
    t.string   "imdb_id"
  end

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
