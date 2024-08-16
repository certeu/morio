import aws from '@site/static/images/aws.json'
import orderBy from 'lodash.orderby'

const Tag = ({ tag }) => tag?.Key ? <span style={{
  borderRadius: '0.25rem',
  padding: '0',
  fontWeight: 'bold',
  border: '2px solid var(--ifm-color-primary)',
  lineHeight: 1.3,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'stretch',
  fontSize: '80%',
}}><span style={{
  background: 'var(--ifm-color-primary)',
  padding: '0 0.5rem',
  color: 'var(--ifm-background-color)',
}}>{tag.Key}</span><span style={{
  background: 'var(--ifm-background-color)',
  padding: '0 0.5rem',
}}>{tag.Value}</span></span> : null

export const AwsImage = ({ img }) => (
  <tr>
    <td><code>{img.ImageId}</code></td>
    <td>{img.Tags.filter(tag => tag.Key === 'morio_version')[0].Value}</td>
    <td>{img.Architecture}</td>
    <td><code>us-east-1</code></td>
    <td>{img.Name}</td>
    <td style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', gap: '0.1rem', textAlign: 'left' }}>
      {orderBy(img.Tags, 'Key', 'ASC').map(tag => <Tag key={tag.Key} tag={tag} />)}
    </td>
  </tr>
)

export const AwsImages = () => (
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Version</th>
        <th>Architecture</th>
        <th>Region</th>
        <th>Name</th>
        <th>Tags</th>
      </tr>
    </thead>
    <tbody>
      {aws.map(img => <AwsImage key={img.ImageId} img={img} />)}
    </tbody>
  </table>
)

