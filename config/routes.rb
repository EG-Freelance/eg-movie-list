Rails.application.routes.draw do
  
  root to: "application#angular"
  
  get '/api/listings' => 'application#listings'
  get '/api/genres' => 'application#genres'
  get '/api/actors' => 'application#actors'
  get '/api/directors' => 'application#directors'
  get '/api/writers' => 'application#writers'
  get '/api/failures' => 'application#failures'
  post '/api/add_listing' => 'application#add_listing'
  post '/api/edit_listing/' => 'application#edit_listing'
  post '/api/import_listing' => 'application#import_listing'
  post '/api/add_rating' => 'application#add_rating'
  post '/api/upload_file' => 'application#upload_file'
  post '/api/authenticate' => 'application#authenticate'
  delete '/api/delete_listing/:id/' => 'application#delete_listing'
  delete '/api/delete_failure/:id/' => 'application#delete_failure'
  delete '/api/delete_all_failures/' => 'application#delete_all_failures'
  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".

  # You can have the root of your site routed with "root"
  # root 'welcome#index'

  # Example of regular route:
  #   get 'products/:id' => 'catalog#view'

  # Example of named route that can be invoked with purchase_url(id: product.id)
  #   get 'products/:id/purchase' => 'catalog#purchase', as: :purchase

  # Example resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Example resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Example resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Example resource route with more complex sub-resources:
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', on: :collection
  #     end
  #   end

  # Example resource route with concerns:
  #   concern :toggleable do
  #     post 'toggle'
  #   end
  #   resources :posts, concerns: :toggleable
  #   resources :photos, concerns: :toggleable

  # Example resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end
end
