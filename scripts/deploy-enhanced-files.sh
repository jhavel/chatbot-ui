#!/bin/bash

# Enhanced File System Deployment Script
# This script helps deploy the enhanced file storage and handling system

set -e

echo "🚀 Deploying Enhanced File Storage System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Supabase CLI is installed
check_supabase_cli() {
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI is not installed. Please install it first:"
        echo "npm install -g supabase"
        exit 1
    fi
    print_success "Supabase CLI found"
}

# Check if we're in the right directory
check_project_structure() {
    if [ ! -f "supabase/config.toml" ]; then
        print_error "This script must be run from the project root directory"
        exit 1
    fi
    print_success "Project structure verified"
}

# Backup current database (optional)
backup_database() {
    print_status "Creating database backup..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_warning "Docker is not running. Skipping database backup."
        print_warning "To enable backups, start Docker Desktop and run this script again."
        return 0
    fi
    
    # Check if Supabase is running locally
    if ! supabase status > /dev/null 2>&1; then
        print_warning "Supabase is not running locally. Skipping database backup."
        print_warning "To enable backups, start Supabase with: supabase start"
        return 0
    fi
    
    if [ -d "supabase/backups" ]; then
        timestamp=$(date +"%Y%m%d_%H%M%S")
        if supabase db dump --file "supabase/backups/backup_${timestamp}.sql" > /dev/null 2>&1; then
            print_success "Database backup created: backup_${timestamp}.sql"
        else
            print_warning "Failed to create backup. Continuing without backup."
        fi
    else
        mkdir -p supabase/backups
        timestamp=$(date +"%Y%m%d_%H%M%S")
        if supabase db dump --file "supabase/backups/backup_${timestamp}.sql" > /dev/null 2>&1; then
            print_success "Database backup created: backup_${timestamp}.sql"
        else
            print_warning "Failed to create backup. Continuing without backup."
        fi
    fi
}

# Apply database migrations
apply_migrations() {
    print_status "Applying database migrations..."
    
    # Check if migration file exists
    if [ ! -f "supabase/migrations/20241201000000_enhance_files_table.sql" ]; then
        print_error "Migration file not found. Please ensure the migration file exists."
        exit 1
    fi
    
    # Check if we're connected to a remote database
    if supabase status > /dev/null 2>&1; then
        print_status "Connected to local Supabase instance"
        supabase db push
    else
        print_warning "Not connected to local Supabase. Attempting remote deployment..."
        print_warning "Make sure you have the correct environment variables set."
        
        # Try remote deployment
        if supabase db push --db-url "$SUPABASE_DB_URL" > /dev/null 2>&1; then
            print_success "Remote database migrations applied successfully"
        else
            print_error "Failed to apply migrations. Please check your configuration:"
            echo "1. Ensure you have SUPABASE_DB_URL set"
            echo "2. Or start local Supabase with: supabase start"
            echo "3. Or manually apply the migration file"
            exit 1
        fi
    fi
    
    print_success "Database migrations applied successfully"
}

# Generate new types
generate_types() {
    print_status "Generating TypeScript types..."
    supabase gen types typescript --local > supabase/types.ts
    print_success "TypeScript types generated"
}

# Test API endpoints
test_api_endpoints() {
    print_status "Testing API endpoints..."
    
    # This would require a running development server
    # For now, just check if the files exist
    endpoints=(
        "app/api/files/upload/route.ts"
        "app/api/files/list/route.ts"
        "app/api/files/stats/route.ts"
        "app/api/files/[fileId]/route.ts"
        "app/api/files/[fileId]/download/route.ts"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if [ -f "$endpoint" ]; then
            print_success "✓ $endpoint"
        else
            print_error "✗ $endpoint (missing)"
        fi
    done
}

# Check frontend components
check_frontend_components() {
    print_status "Checking frontend components..."
    
    components=(
        "components/chat/enhanced-file-manager.tsx"
        "components/chat/file-integration-example.tsx"
    )
    
    for component in "${components[@]}"; do
        if [ -f "$component" ]; then
            print_success "✓ $component"
        else
            print_error "✗ $component (missing)"
        fi
    done
}

# Verify database schema
verify_schema() {
    print_status "Verifying database schema..."
    
    # This would require connecting to the database
    # For now, just provide instructions
    print_warning "Please manually verify the database schema:"
    echo "1. Connect to your Supabase database"
    echo "2. Run: SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'files';"
    echo "3. Verify the following columns exist:"
    echo "   - tags (TEXT[])"
    echo "   - url (TEXT)"
    echo "   - uploaded_by (TEXT)"
    echo "   - uploaded_at (TIMESTAMPTZ)"
    echo "   - related_entity_id (UUID)"
    echo "   - related_entity_type (TEXT)"
}

# Main deployment process
main() {
    echo "=========================================="
    echo "Enhanced File System Deployment"
    echo "=========================================="
    
    # Pre-flight checks
    check_supabase_cli
    check_project_structure
    
    # Ask for backup confirmation
    read -p "Do you want to create a database backup before proceeding? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        backup_database
    else
        print_warning "Skipping database backup"
    fi
    
    # Apply migrations
    apply_migrations
    
    # Generate types
    generate_types
    
    # Test components
    test_api_endpoints
    check_frontend_components
    
    # Verify schema
    verify_schema
    
    echo "=========================================="
    print_success "Enhanced File System deployment completed!"
    echo "=========================================="
    
    echo ""
    echo "Next steps:"
    echo "1. Start your development server: npm run dev"
    echo "2. Test the file upload functionality"
    echo "3. Verify the enhanced file manager component"
    echo "4. Check that tags and metadata are working"
    echo ""
    echo "For more information, see: docs/ENHANCED_FILE_SYSTEM.md"
}

# Run main function
main "$@" 