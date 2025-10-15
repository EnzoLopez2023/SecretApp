import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import {
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  useTheme,
  alpha
} from '@mui/material'
import { styled } from '@mui/material/styles'

// Styled components for better markdown rendering
const StyledCodeBlock = styled(Paper)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.grey[900], 0.05),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
  fontSize: '0.875rem',
  overflowX: 'auto',
  margin: theme.spacing(1, 0),
}))

const StyledInlineCode = styled('code')(({ theme }) => ({
  backgroundColor: alpha(theme.palette.grey[900], 0.1),
  padding: theme.spacing(0.25, 0.5),
  borderRadius: 4,
  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
  fontSize: '0.875em',
}))

const StyledBlockquote = styled(Box)(({ theme }) => ({
  borderLeft: `4px solid ${theme.palette.primary.main}`,
  marginLeft: 0,
  paddingLeft: theme.spacing(2),
  fontStyle: 'italic',
  color: theme.palette.text.secondary,
  margin: theme.spacing(1, 0),
}))

interface MarkdownRendererProps {
  children: string
  sx?: object
}

export default function MarkdownRenderer({ children, sx = {} }: MarkdownRendererProps) {
  const theme = useTheme()

  const components = {
    // Headers
    h1: ({ children }: any) => (
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mt: 2, mb: 1 }}>
        {children}
      </Typography>
    ),
    h2: ({ children }: any) => (
      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
        {children}
      </Typography>
    ),
    h3: ({ children }: any) => (
      <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600, mt: 1.5, mb: 1 }}>
        {children}
      </Typography>
    ),
    h4: ({ children }: any) => (
      <Typography variant="subtitle1" component="h4" gutterBottom sx={{ fontWeight: 600, mt: 1.5, mb: 0.5 }}>
        {children}
      </Typography>
    ),
    h5: ({ children }: any) => (
      <Typography variant="subtitle2" component="h5" gutterBottom sx={{ fontWeight: 600, mt: 1, mb: 0.5 }}>
        {children}
      </Typography>
    ),
    h6: ({ children }: any) => (
      <Typography variant="body1" component="h6" gutterBottom sx={{ fontWeight: 600, mt: 1, mb: 0.5 }}>
        {children}
      </Typography>
    ),

    // Paragraphs
    p: ({ children }: any) => (
      <Typography variant="body1" paragraph sx={{ lineHeight: 1.7, mb: 1.5 }}>
        {children}
      </Typography>
    ),

    // Strong/Bold
    strong: ({ children }: any) => (
      <Typography component="strong" sx={{ fontWeight: 700 }}>
        {children}
      </Typography>
    ),

    // Emphasis/Italic
    em: ({ children }: any) => (
      <Typography component="em" sx={{ fontStyle: 'italic' }}>
        {children}
      </Typography>
    ),

    // Lists
    ul: ({ children }: any) => (
      <List dense sx={{ pl: 2, py: 0 }}>
        {children}
      </List>
    ),
    ol: ({ children }: any) => (
      <List dense sx={{ pl: 2, py: 0 }}>
        {children}
      </List>
    ),
    li: ({ children }: any) => (
      <ListItem dense sx={{ pl: 0, py: 0.25 }}>
        <ListItemText 
          primary={children} 
          primaryTypographyProps={{
            variant: 'body1',
            sx: { lineHeight: 1.6 }
          }}
        />
      </ListItem>
    ),

    // Code blocks
    code: ({ node, inline, className, children, ...props }: any) => {
      if (inline) {
        return <StyledInlineCode {...props}>{children}</StyledInlineCode>
      }
      return (
        <StyledCodeBlock>
          <code {...props}>{children}</code>
        </StyledCodeBlock>
      )
    },

    // Blockquotes
    blockquote: ({ children }: any) => (
      <StyledBlockquote>
        {children}
      </StyledBlockquote>
    ),

    // Horizontal rules
    hr: () => <Divider sx={{ my: 2 }} />,

    // Links
    a: ({ children, href }: any) => (
      <Typography
        component="a"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          color: theme.palette.primary.main,
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
        }}
      >
        {children}
      </Typography>
    ),

    // Tables
    table: ({ children }: any) => (
      <Box sx={{ overflowX: 'auto', my: 2 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          {children}
        </table>
      </Box>
    ),
    thead: ({ children }: any) => <thead>{children}</thead>,
    tbody: ({ children }: any) => <tbody>{children}</tbody>,
    tr: ({ children }: any) => (
      <tr style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
        {children}
      </tr>
    ),
    th: ({ children }: any) => (
      <th style={{ 
        padding: theme.spacing(1), 
        textAlign: 'left',
        fontWeight: 600,
        backgroundColor: alpha(theme.palette.grey[500], 0.1)
      }}>
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td style={{ padding: theme.spacing(1) }}>
        {children}
      </td>
    ),
  }

  return (
    <Box sx={{ ...sx }}>
      <ReactMarkdown
        components={components}
        rehypePlugins={[rehypeRaw]}
      >
        {children}
      </ReactMarkdown>
    </Box>
  )
}