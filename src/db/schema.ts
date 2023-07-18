export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName: string
          query: string
          variables: Json
          extensions: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_dynamic_inputs: {
        Row: {
          script: string
          uid: number
        }
        Insert: {
          script: string
          uid: number
        }
        Update: {
          script?: string
          uid?: number
        }
      }
      admin_start_messages: {
        Row: {
          message_id: number
          uid: number
        }
        Insert: {
          message_id: number
          uid: number
        }
        Update: {
          message_id?: number
          uid?: number
        }
      }
      greetings: {
        Row: {
          chat_id: number
          datetime: string | null
          message_id: number
        }
        Insert: {
          chat_id: number
          datetime?: string | null
          message_id: number
        }
        Update: {
          chat_id?: number
          datetime?: string | null
          message_id?: number
        }
      }
      groups: {
        Row: {
          id: number
          rules_message_id: number
        }
        Insert: {
          id: number
          rules_message_id: number
        }
        Update: {
          id?: number
          rules_message_id?: number
        }
      }
      updates: {
        Row: {
          chat_id: number
          data: Json
          received_at: string | null
          type: string
          uid: number | null
          update_id: number
        }
        Insert: {
          chat_id: number
          data: Json
          received_at?: string | null
          type: string
          uid?: number | null
          update_id: number
        }
        Update: {
          chat_id?: number
          data?: Json
          received_at?: string | null
          type?: string
          uid?: number | null
          update_id?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      distinct_updates: {
        Args: { group_id: number; amount: number }
        Returns: unknown
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          path_tokens: string[] | null
          updated_at: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      extension: {
        Args: { name: string }
        Returns: string
      }
      filename: {
        Args: { name: string }
        Returns: string
      }
      foldername: {
        Args: { name: string }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: { size: number; bucket_id: string }[]
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits: number
          levels: number
          offsets: number
          search: string
          sortcolumn: string
          sortorder: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

